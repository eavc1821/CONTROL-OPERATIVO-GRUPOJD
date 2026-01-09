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

    await repo.updateAprobacionEstado(
      client,
      aprobacion.id,
      accion === "aprobar" ? "aprobada" : "rechazada",
      comentario
    );

    // 4️⃣ Expirar la otra aprobación
    await repo.expirarOtrasAprobaciones(
      client,
      solicitud.id,
      aprobacion.id
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
        canal: "whatsapp"
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
      proveedor: data.proveedor,
      total: data.total,
      tipo_pago: data.tipo_pago,
      descripcion: data.descripcion
    }
  };
}


module.exports = {
  resolveByToken,
  previewByToken
};
