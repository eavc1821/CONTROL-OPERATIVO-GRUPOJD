// src/modules/aprobaciones/aprobaciones.service.js
const pool = require("../../core/db");
const repo = require("./repository");
const bitacora = require("../bitacora/service");

async function resolveByToken({ token, accion, comentario, ip, userAgent }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Bloquear aprobación
    const aprobacion = await repo.lockByTokenTx(client, token);

    if (!aprobacion) {
      throw new Error("Token inválido o inexistente");
    }

    if (aprobacion.estado !== "pendiente") {
      throw new Error("Este token ya fue utilizado");
    }

    if (aprobacion.solicitud_estado !== "pendiente") {
      throw new Error("La solicitud ya fue resuelta");
    }

    // 2️⃣ Resolver aprobación
    const estadoAprobacion =
      accion === "aprobar" ? "aprobada" : "rechazada";

    await repo.marcarAprobacionTx(
      client,
      token,
      estadoAprobacion,
      comentario,
      ip,
      userAgent
    );

    // 3️⃣ Anular las demás
    await repo.anularOtrasAprobacionesTx(
      client,
      aprobacion.solicitud_id,
      token
    );

    // 4️⃣ Resolver solicitud
    const estadoSolicitud =
      accion === "aprobar" ? "aprobada" : "anulada";

    const solicitud = await repo.actualizarSolicitudTx(
      client,
      aprobacion.solicitud_id,
      estadoSolicitud,
      aprobacion.usuario_id
    );

    if (!solicitud) {
      throw new Error("No se pudo actualizar la solicitud");
    }

    await client.query("COMMIT");

    // 5️⃣ Bitácora (fuera de la transacción)
    await bitacora.registrar(
      { usuario_id: aprobacion.usuario_id },
      {
        modulo: "aprobaciones",
        accion: accion.toUpperCase(),
        descripcion: `Resolución por token de la solicitud ${solicitud.correlativo}`,
        data_nueva: {
          solicitud_id: solicitud.id,
          estado: estadoSolicitud
        }
      }
    );

    return {
      solicitud_id: solicitud.id,
      estado: solicitud.estado,
      aprobado_por: aprobacion.usuario_id
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
    throw new Error("Token inválido");
  }

  if (data.solicitud_estado !== "pendiente") {
    throw new Error("La solicitud ya fue resuelta");
  }

  if (data.aprobacion_estado !== "pendiente") {
    throw new Error("Este token ya fue utilizado");
  }

  return {
    correlativo: data.correlativo,
    proveedor: data.proveedor,
    total: data.total,
    tipo_pago: data.tipo_pago,
    descripcion: data.descripcion
  };
}

module.exports = {
  resolveByToken,
  previewByToken
};
