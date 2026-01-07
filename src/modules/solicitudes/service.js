const repo = require('./repository');
const storage = require('../../core/storage');
const pool = require('../../core/db');
const bitacora = require('../bitacora/service');
const assertCtx = require("../../utils/assertSolicitudCtx");
const pagoRepo = require("../pagos/pagos.repository");
const aprobacionesRepo = require("../aprobaciones/repository");
const { buildWhatsAppApprovalMessage } = require("../aprobaciones/messageBuilder");

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

    // 3️⃣ Obtener aprobadores
    const aprobadores = await repo.findAprobadoresByEmpresaTx(
      client,
      ctx.empresaId
    );

    if (!aprobadores || aprobadores.length < 2) {
      throw new Error("No hay suficientes aprobadores configurados");
    }

    const usuariosIds = aprobadores.slice(0, 2).map(u => u.id);

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

  // 6️⃣ Notificar aprobadores (WhatsApp)
  for (const { usuario_id, token } of tokens) {
    const aprobador = await usuariosRepo.findContactoById(usuario_id);

    if (!aprobador || !aprobador.telefono) {
      console.warn(
        `Aprobador ${usuario_id} sin teléfono, no se envía WhatsApp`
      );
      continue;
    }

    const { message } = buildWhatsAppApprovalMessage({
      solicitud: {
        correlativo: solicitud.correlativo,
        proveedor_nombre: payload.proveedor_nombre || "Proveedor",
        total: solicitud.total,
        tipo_pago: solicitud.tipo_pago,
        descripcion: solicitud.descripcion
      },
      token,
      baseUrl: process.env.APP_BASE_URL
    });

    await sendWhatsApp({
      telefono: aprobador.telefono,
      message,
      metadata: {
        solicitud_id: solicitud.id,
        correlativo: solicitud.correlativo
      }
    });
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

    const solicitud = await repo.findById(ctx.empresaId, id);
    if (!solicitud) throw new Error("Solicitud no encontrada");

    // Validar CAI
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

    // Congelar CAI
    await client.query(
      `
      UPDATE solicitudes
      SET proveedor_cai = $1
      WHERE id = $2 AND empresa_id = $3
      `,
      [proveedorCai, id, ctx.empresaId]
    );

    // Datos de factura
    await updateSolicitudFacturaData(client, id, payload);

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
    const saved = await storage.saveFileLocal({
      tempPath: file.path,
      originalName: file.originalname,
      entidad: "solicitud",
      entidadId: id,
      correlativo: solicitud.correlativo
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
      referencia: payload.referencia,
      notas: payload.notas,
      usuario_id: ctx.usuarioId,
      empresa_id: ctx.empresaId
    });

    const saved = await storage.saveFileLocal({
      tempPath: file.path,
      originalName: file.originalname,
      entidad: "pago",
      entidadId: pago.id,
      correlativo: solicitud.correlativo
    });

    await client.query(
      `
      INSERT INTO archivos
        (entidad, entidad_id, nombre_original, path, url, mimetype, correlativo, empresa_id, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
      `,
      [
        "pago",
        pago.id,
        file.originalname,
        saved.path,
        saved.url,
        file.mimetype,
        solicitud.correlativo,
        ctx.empresaId
      ]
    );

    await client.query(
      `UPDATE pagos SET tiene_factura = true WHERE id = $1`,
      [pago.id]
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