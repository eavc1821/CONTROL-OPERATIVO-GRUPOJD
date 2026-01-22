const repo = require('./repository');
const storage = require('../../core/storage');
const pool = require('../../core/db');
const bitacora = require('../bitacora/service');
const assertCtx = require("../../utils/assertSolicitudCtx");
const pagoRepo = require("../pagos/pagos.repository");
const aprobacionesRepo = require("../aprobaciones/repository");
const usuariosRepo = require("../usuarios/repository");
const { buildApprovalEmail } = require("../aprobaciones/emailBuilder");
const { sendEmail } = require("../../core/notifications/email");
const proveedorRepo = require("../proveedores/repository");



async function create(ctx, payload) {
  assertCtx(ctx);

  const client = await pool.connect();

  let solicitud;
  let tokens;

  try {
    await client.query("BEGIN");

    // 1️⃣ Datos base de la solicitud
    const data = {
      ...payload,
      usuario_id: ctx.usuarioId,
      empresa_id: ctx.empresaId
    };

    // 2️⃣ Crear solicitud
    solicitud = await repo.createSolicitudTx(client, data);

    // 3️⃣ Obtener aprobadores configurados
    const aprobadores = await repo.findAprobadoresByEmpresaTx(
      client,
      ctx.empresaId
    );

    if (!aprobadores || aprobadores.length === 0) {
      throw new Error("No hay aprobadores configurados para la empresa");
    }

    const usuariosIds = aprobadores.slice(0, 2).map(u => u.usuario_id);

    // 4️⃣ Crear aprobaciones + tokens
    tokens = await aprobacionesRepo.crearAprobacionesInicialesTx(
      client,
      solicitud.id,
      usuariosIds
    );

    await client.query("COMMIT");

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  // ===============================
  // 🔔 LÓGICA FUERA DE TRANSACCIÓN
  // ===============================

  // 5️⃣ Bitácora
  await bitacora.registrar(
    {
      usuario_id: ctx.usuarioId,
      empresa_id: ctx.empresaId
    },
    {
      modulo: "solicitudes",
      accion: "CREATE",
      descripcion: `Creó la solicitud ${solicitud.correlativo}`,
      data_nueva: solicitud
    }
  );


  // 6️⃣ Notificar aprobadores (Email)
for (const { usuario_id, token } of tokens) {
  try {
    const aprobador = await usuariosRepo.findContactoById(usuario_id);

    if (!aprobador || !aprobador.email) {
      console.warn(
        `Aprobador ${usuario_id} sin email, no se envía notificación`
      );
      continue;
    }

    const proveedor = await proveedorRepo.getById(
      solicitud.proveedor_id
    );

    const email = buildApprovalEmail({
      solicitud: {
        correlativo: solicitud.correlativo,
        proveedor_nombre: proveedor.nombre,
        total: solicitud.total,
        tipo_pago: solicitud.tipo_pago
      },
      token,
      baseUrl: process.env.APP_BASE_URL
    });

    // ⚠️ Enviar SIN bloquear la respuesta HTTP
    sendEmail({
      to: aprobador.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      metadata: {
        solicitud_id: solicitud.id,
        aprobador_id: usuario_id,
        canal: "email"
      }
    }).catch(err => {
      console.error("❌ Error enviando email de aprobación", {
        solicitud_id: solicitud.id,
        usuario_id,
        error: err.message
      });
    });

  } catch (err) {
    console.error("❌ Error preparando email de aprobación", {
      solicitud_id: solicitud.id,
      usuario_id,
      error: err.message
    });
  }
}

  return solicitud;
}


async function list(ctx, filters) {
  assertCtx(ctx);
  return repo.findAll(ctx.empresaId, filters);
}


async function getById(ctx, id) {
  assertCtx(ctx);
  return repo.findById(ctx.empresaId, id);
}


async function update(ctx, id, data) {
  assertCtx(ctx);

  const solicitud = await repo.findById(ctx.empresaId, id);
  if (!solicitud) throw new Error("Solicitud no encontrada");

  if (solicitud.estado !== "pendiente") {
    throw new Error("Solo se pueden editar solicitudes pendientes");
  }

  const updated = await repo.update(id, {
    ...data,
    empresaId: ctx.empresaId
  });

  await bitacora.registrar(
    {
      usuario_id: ctx.usuarioId,
      empresa_id: ctx.empresaId
    },
    {
      modulo: "solicitudes",
      accion: "UPDATE",
      descripcion: `Actualizó la solicitud ${solicitud.correlativo}`,
      data_anterior: solicitud,
      data_nueva: updated
    }
  );

  return updated;
}



async function approveWithFile(ctx, id, payload, file) {
  assertCtx(ctx);

  if (!ctx.usuarioId) {
    throw new Error("usuarioId es obligatorio para aprobar");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🔥 Leer de la tabla real, no de la vista
    const { rows } = await client.query(
      `SELECT proveedor_id, correlativo FROM solicitudes WHERE id = $1`,
      [id]
    );

    const solicitud = rows[0];
    if (!solicitud) throw new Error("Solicitud no encontrada");

    // Validar CAI del proveedor
    const caiResult = await client.query(
      `SELECT cai FROM proveedores WHERE id = $1`,
      [solicitud.proveedor_id]
    );

    const proveedorCai = caiResult.rows[0]?.cai;
    if (!proveedorCai) {
      throw new Error("El proveedor no tiene CAI configurado");
    }

    const updated = await repo.updateEstadoTx(
      client,
      id,
      "aprobada",
      ctx.usuarioId
    );

    if (!updated) throw new Error("No se pudo aprobar la solicitud");


    console.log("DEBUG_APROBAR", {
      solicitudId: id,
      proveedorId: solicitud.proveedor_id,
      proveedorCai
    });

    // Congelar CAI
    await client.query(
      `
      UPDATE solicitudes
      SET proveedor_cai = $1 || '___DEBUG'
      WHERE id = $2
      `,
      [proveedorCai, id]
    );

    // Registrar aprobación
    await client.query(
      `
      INSERT INTO aprobaciones
        (solicitud_id, usuario_id, accion, comentario, created_at)
      VALUES ($1,$2,'aprobar',$3,NOW())
      `,
      [id, ctx.usuarioId, payload.comentario || null]
    );

    await client.query("COMMIT");

    await bitacora.registrar(
      {
        usuario_id: ctx.usuarioId,
        empresa_id: ctx.empresaId
      },
      {
        modulo: "solicitudes",
        accion: "APPROVE",
        descripcion: `Aprobó la solicitud ${solicitud.correlativo}`,
        data_anterior: solicitud,
        data_nueva: { estado: "aprobada" }
      }
    );

    return updated;

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}



// RECHAZAR con comentario (también usando updateEstadoTx)
async function rejectWithComment(ctx, id, comentario) {
  assertCtx(ctx);

  if (!ctx.usuarioId) {
    throw new Error("usuarioId es obligatorio para rechazar");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updated = await repo.updateEstadoTx(
      client,
      id,
      "rechazada",
      ctx.usuarioId
    );

    if (!updated) throw new Error("Solicitud no encontrada");

    await client.query(
      `
      INSERT INTO aprobaciones
        (solicitud_id, usuario_id, accion, comentario, created_at)
      VALUES ($1,$2,'rechazar',$3,NOW())
      `,
      [id, ctx.usuarioId, comentario || null]
    );

    await client.query("COMMIT");

    await bitacora.registrar(
      {
        usuario_id: ctx.usuarioId,
        empresa_id: ctx.empresaId
      },
      {
        modulo: "solicitudes",
        accion: "REJECT",
        descripcion: `Rechazó la solicitud ${id}`,
        data_nueva: { comentario }
      }
    );

    return updated;

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}



// 🔵 Subir nueva factura (versionada, NO reemplazo silencioso)
async function updateFactura(empresaId, id, file) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Buscar solicitud
    const solicitud = await repo.findById(empresaId, id);
    if (!solicitud) throw new Error("Solicitud no encontrada");

    // 2️⃣ Marcar factura vigente anterior como REEMPLAZADA
    await client.query(
      `
      UPDATE archivos
      SET estado = 'reemplazada'
      WHERE entidad = 'solicitud'
        AND entidad_id = $1
        AND empresa_id = $2
        AND estado = 'vigente'
      `,
      [id, empresaId]
    );

    // 3️⃣ Guardar archivo físico
    const saved = await storage.saveFileS3({
      tempPath: file.path,
      originalName: file.originalname,
      entidad: "solicitud",
      entidadId: id,
      correlativo: solicitud.correlativo,
      empresaId: empresaId,
      empresaNombre: solicitud.empresa_nombre || solicitud.empresa || ""
    });

    // 4️⃣ Insertar nueva factura como VIGENTE
    await client.query(
      `
      INSERT INTO archivos
        (entidad, entidad_id, nombre_original, path, url, mimetype, correlativo, estado, empresa_id, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'vigente',$8,NOW())
      `,
      [
        "solicitud",
        id,
        file.originalname,
        saved.path,
        saved.url,
        file.mimetype,
        solicitud.correlativo,
        empresaId
      ]
    );

    // 5️⃣ Actualizar timestamp de solicitud
    await client.query(
      `UPDATE solicitudes SET updated_at = NOW() WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

    // 6️⃣ Bitácora explícita
    await bitacora.registrar(
      {
        usuario_id: solicitud.usuario_id,
        empresa_id: empresaId
      },
      {
        modulo: "solicitudes",
        accion: "REEMPLAZAR_FACTURA",
        descripcion: `Reemplazó factura de la solicitud ${solicitud.correlativo} por documento inválido/vencido`,
        data_nueva: { factura_url: saved.url }
      }
    );

    return { factura_url: saved.url };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}



async function updateSolicitudFacturaData(client, id, { numero_factura, fecha_factura }) {
  await client.query(
    `
      UPDATE solicitudes
      SET 
        numero_factura = $1,
        fecha_factura = $2::date,
        updated_at = NOW()
      WHERE id = $3
    `,
    [numero_factura, fecha_factura, id]
  );
}


// 👉 Listar pagos de una solicitud
async function listPagosBySolicitud(ctx, solicitudId) {
  assertCtx(ctx);
  return repo.findPagosBySolicitud(ctx.empresaId, solicitudId);
}

// 👉 Normalizar número de factura
function normalizarFactura(valor) {
  if (!valor) return null;
  return valor.replace(/-/g, "").trim();
}

// 👉 Registrar pago (solo crédito y aprobada)
async function registrarPago(ctx, solicitudId, payload, file) {
  assertCtx(ctx);

  if (!ctx.usuarioId) {
    throw new Error("usuarioId es obligatorio para registrar pagos");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const solicitud = await repo.findById(ctx.empresaId, solicitudId);

    // ============================
    // 🔒 VALIDACIÓN FISCAL DEL PROVEEDOR
    // ============================

    // 1️⃣ Obtener proveedor real de la solicitud
    const proveedor = await proveedorRepo.getById(solicitud.proveedor_id);

    if (!proveedor) {
      throw new Error("Proveedor asociado a la solicitud no existe");
    }

    // 2️⃣ Validar número de factura vs rango
    const factura = normalizarFactura(payload.numero_factura);
    const rangoDesde = normalizarFactura(proveedor.rango_factura_desde);
    const rangoHasta = normalizarFactura(proveedor.rango_factura_hasta);

    if (rangoDesde && rangoHasta) {
      if (!factura) {
        throw new Error("El número de factura es obligatorio");
      }

      if (factura < rangoDesde || factura > rangoHasta) {
        throw new Error(
          "El número de factura está fuera del rango autorizado del proveedor"
        );
      }
    }

    // 3️⃣ Validar fecha de factura vs fecha límite de emisión
    if (proveedor.fecha_limite_emision && payload.fecha_factura) {
      const fechaFactura = new Date(payload.fecha_factura);
      const fechaLimite = new Date(proveedor.fecha_limite_emision);

      if (fechaFactura > fechaLimite) {
        throw new Error(
          "La fecha de la factura excede la fecha límite de emisión del proveedor"
        );
      }
    }

    if (!solicitud) {
      throw new Error("Solicitud no encontrada");
    }

    if (!["aprobada", "pagada"].includes(solicitud.estado)) {
      throw new Error(
        "Solo se pueden registrar pagos sobre solicitudes aprobadas o pagadas"
      );
    }

    const total = Number(solicitud.total || 0);

    const totalPagadoActual =
      await repo.getTotalPagadoBySolicitudTx(client, solicitudId);

    const monto = Number(payload.monto);
    const nuevoTotalPagado = totalPagadoActual + monto;

    if (nuevoTotalPagado > total) {
      throw new Error("El pago excede el total de la solicitud");
    }

    const pago = await repo.insertPagoTx(client, {
      solicitud_id: solicitudId,
      monto,
      fecha_pago: payload.fecha_pago,
      metodo_pago: payload.metodo_pago,
      referencia: payload.numero_factura,
      notas: payload.notas,
      usuario_id: ctx.usuarioId,
      empresa_id: ctx.empresaId
    });

    await client.query(
      `
      UPDATE pagos
      SET
        numero_factura = $1,
        fecha_factura = $2,
        updated_at = NOW()
      WHERE id = $3
      `,
      [payload.numero_factura, payload.fecha_factura, pago.id]
    );

    const saved = await storage.saveFileS3({
      tempPath: file.path,
      originalName: file.originalname,
      entidad: "pago",
      entidadId: pago.id,
      correlativo: solicitud.correlativo,
      empresaId: ctx.empresaId,
      empresaNombre: solicitud.empresa_nombre || solicitud.empresa || ""
    });

    await client.query(
      `UPDATE pagos SET factura_url = $1 WHERE id = $2`,
      [saved.url, pago.id]
    );

    let nuevoEstado = solicitud.estado;

    if (nuevoTotalPagado >= total && solicitud.estado !== "pagada") {
      nuevoEstado = "pagada";
      await repo.updateEstadoTx(client, solicitudId, "pagada", ctx.usuarioId);
    }

    await client.query("COMMIT");

    await bitacora.registrar(
      {
        usuario_id: ctx.usuarioId,
        empresa_id: ctx.empresaId
      },
      {
        modulo: "pagos",
        accion: "CREATE",
        descripcion: `Registró un pago de ${monto} en la solicitud ${solicitud.correlativo}`,
        data_nueva: {
          solicitud_id: solicitudId,
          monto,
          estado_final: nuevoEstado
        }
      }
    );

    return {
      pago,
      total_pagado: nuevoTotalPagado,
      total_solicitud: total,
      saldo: total - nuevoTotalPagado,
      estado: nuevoEstado
    };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}


async function getPagoById(ctx, id) {
  assertCtx(ctx);
  return pagoRepo.getById(id, ctx.empresaId);
}


module.exports = 
{ create, 
  update,
  list, 
  getById, 
  approveWithFile, 
  rejectWithComment, 
  updateFactura, 
  updateSolicitudFacturaData,
  listPagosBySolicitud,
  registrarPago,
  getPagoById,

};