// src/modules/aprobaciones/aprobaciones.repository.js
async function lockByTokenTx(client, token) {
  const q = `
    SELECT
      sa.id,
      sa.solicitud_id,
      sa.usuario_id,
      sa.estado,
      s.estado AS solicitud_estado
    FROM solicitud_aprobaciones sa
    JOIN solicitudes s ON s.id = sa.solicitud_id
    WHERE sa.token = $1
    FOR UPDATE
  `;
  const { rows } = await client.query(q, [token]);
  return rows[0];
}

async function marcarAprobacionTx(client, token, estado, comentario, ip, ua) {
  const q = `
    UPDATE solicitud_aprobaciones
    SET
      estado = $1,
      comentario = $2,
      responded_at = NOW(),
      ip_origen = $3,
      user_agent = $4
    WHERE token = $5
    RETURNING *
  `;
  const { rows } = await client.query(q, [
    estado,
    comentario || null,
    ip || null,
    ua || null,
    token
  ]);
  return rows[0];
}

async function anularOtrasAprobacionesTx(client, solicitudId, token) {
  const q = `
    UPDATE solicitud_aprobaciones
    SET estado = 'anulada'
    WHERE solicitud_id = $1
      AND token <> $2
      AND estado = 'pendiente'
  `;
  await client.query(q, [solicitudId, token]);
}

async function actualizarSolicitudTx(client, solicitudId, estado, usuarioId) {
  const q = `
    UPDATE solicitudes
    SET
      estado = $1,
      aprobado_por = $2,
      fecha_aprobacion = NOW(),
      updated_at = NOW()
    WHERE id = $3
      AND estado = 'pendiente'
    RETURNING *
  `;
  const { rows } = await client.query(q, [
    estado,
    usuarioId,
    solicitudId
  ]);
  return rows[0];
}


async function crearAprobacionesInicialesTx(client, solicitudId, usuariosIds) {
  const q = `
    INSERT INTO solicitud_aprobaciones (
      solicitud_id,
      usuario_id,
      token,
      estado,
      canal
    )
    VALUES ${usuariosIds.map((_, i) =>
      `($1, $${i + 2}, gen_random_uuid(), 'pendiente', 'whatsapp')`
    ).join(",")}
    RETURNING usuario_id, token
  `;

  const params = [solicitudId, ...usuariosIds];
  const { rows } = await client.query(q, params);
  return rows;
}

async function previewByToken(token) {
  const q = `
    SELECT
      s.correlativo,
      p.nombre AS proveedor,
      s.total,
      s.tipo_pago,
      s.descripcion,
      sa.estado AS aprobacion_estado,
      s.estado AS solicitud_estado
    FROM solicitud_aprobaciones sa
    JOIN solicitudes s ON s.id = sa.solicitud_id
    JOIN proveedores p ON p.id = s.proveedor_id
    WHERE sa.token = $1
  `;

  const { rows } = await pool.query(q, [token]);
  return rows[0];
}


async function findByTokenForUpdate(client, token) {
  const q = `
    SELECT *
    FROM aprobaciones
    WHERE token = $1
    FOR UPDATE
  `;
  const { rows } = await client.query(q, [token]);
  return rows[0];
}

async function updateAprobacionEstado(client, id, estado, comentario = null) {
  const q = `
    UPDATE aprobaciones
    SET estado = $1,
        comentario = $2,
        updated_at = NOW()
    WHERE id = $3
  `;
  await client.query(q, [estado, comentario, id]);
}

async function expirarOtrasAprobaciones(client, solicitudId, aprobacionId) {
  const q = `
    UPDATE aprobaciones
    SET estado = 'expirada',
        updated_at = NOW()
    WHERE solicitud_id = $1
      AND id <> $2
      AND estado = 'pendiente'
  `;
  await client.query(q, [solicitudId, aprobacionId]);
}



module.exports = {
  lockByTokenTx,
  marcarAprobacionTx,
  anularOtrasAprobacionesTx,
  actualizarSolicitudTx,
  crearAprobacionesInicialesTx,
  previewByToken,
  findByTokenForUpdate,
  updateAprobacionEstado,
  expirarOtrasAprobaciones

};
