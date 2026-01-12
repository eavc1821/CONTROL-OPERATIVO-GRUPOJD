// src/modules/aprobaciones/aprobaciones.service.js
const pool = require("../../core/db");
const repo = require("./repository");
const bitacora = require("../bitacora/service");

async function resolveByToken({ token, accion, comentario, ip, userAgent }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Buscar aprobación y bloquear
    const aprobacion = await repo.findByTokenForUpdate(client, token);

    if (!aprobacion) {
      return { status: "TOKEN_INVALIDO" };
    }

    if (aprobacion.estado !== "pendiente") {
      return { status: "SOLICITUD_RESUELTA" };
    }

    // 2️⃣ Bloquear solicitud
    const solicitud = await client.query(
      `SELECT * FROM solicitudes WHERE id = $1 FOR UPDATE`,
      [aprobacion.solicitud_id]
    ).then(r => r.rows[0]);

    if (!solicitud || solicitud.estado !== "pendiente") {
      return { status: "SOLICITUD_RESUELTA" };
    }

    // 🔥 Congelar CAI del proveedor (solo si va a aprobar)
    if (accion === "aprobar") {
      const caiResult = await client.query(
        `SELECT cai FROM proveedores WHERE id = $1`,
        [solicitud.proveedor_id]
      );

      const proveedorCai = caiResult.rows[0]?.cai;
      if (!proveedorCai) {
        throw new Error("El proveedor no tiene CAI configurado");
      }

      await client.query(
        `
        UPDATE solicitudes
        SET proveedor_cai = $1
        WHERE id = $2
        `,
        [proveedorCai, solicitud.id]
      );
    }

    // 3️⃣ Resolver
    const nuevoEstadoSolicitud =
      accion === "aprobar" ? "aprobada" : "rechazada";

    await client.query(
      `
      UPDATE solicitudes
      SET estado = $1,
          aprobado_por = $2,
          fecha_aprobacion = NOW()
      WHERE id = $3
      `,
      [nuevoEstadoSolicitud, aprobacion.usuario_id, solicitud.id]
    );

    await repo.marcarAprobacionTx(
      client,
      token,
      accion === "aprobar" ? "aprobada" : "rechazada",
      comentario,
      ip,
      userAgent
    );

    await repo.anularOtrasAprobacionesTx(
      client,
      solicitud.id,
      token
    );

    await client.query("COMMIT");

    await bitacora.registrar(
      {
        usuario_id: aprobacion.usuario_id,
        empresa_id: solicitud.empresa_id
      },
      {
        modulo: "aprobaciones",
        accion: accion === "aprobar" ? "APROBAR" : "RECHAZAR",
        descripcion:
          accion === "aprobar"
            ? `Aprobó la solicitud ${solicitud.correlativo}`
            : `Rechazó la solicitud ${solicitud.correlativo}`,
        data_nueva: {
          solicitud_id: solicitud.id,
          correlativo: solicitud.correlativo,
          estado_final: nuevoEstadoSolicitud,
          canal: "email"
        }
      }
    );

    return {
      status: "OK",
      resultado: nuevoEstadoSolicitud
    };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}


async function previewByToken(token) {
  const data = await repo.previewByToken(token);

  if (!data) {
    return { status: "TOKEN_INVALIDO" };
  }

  if (data.solicitud_estado !== "pendiente") {
    return { status: "SOLICITUD_RESUELTA" };
  }

  if (data.aprobacion_estado !== "pendiente") {
    return { status: "SOLICITUD_RESUELTA" };
  }

  return {
    status: "OK",
    solicitud: {
      correlativo: data.correlativo,
      empresa: data.empresa,
      solicitante: data.solicitante,
      proveedor: data.proveedor,
      categoria: data.categoria,
      total: data.total,
      tipo_pago: data.tipo_pago,
      fecha_solicitud: data.fecha_solicitud,
      descripcion: data.descripcion
    }
  };
}



module.exports = {
  resolveByToken,
  previewByToken
};
