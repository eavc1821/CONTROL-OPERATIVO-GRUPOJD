// src/modules/solicitudes/repository.js
const pool = require('../../core/db');

async function createSolicitud({ proveedor_id, usuario_id, tipo_pago, notas, total, fecha_solicitud, descripcion,categoria_id, empresa_id }) {
  const q = `
    INSERT INTO solicitudes 
    (proveedor_id, usuario_id, tipo_pago, notas, total, fecha_solicitud, descripcion,categoria_id, empresa_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `;
  const { rows } = await pool.query(q, [
    proveedor_id,
    usuario_id,
    tipo_pago,
    notas,
    total || 0,
    fecha_solicitud,
    descripcion,
    categoria_id,
    empresa_id
  ]);
  return rows[0];
}


async function createSolicitudTx(
  client,
  {
    proveedor_id,
    usuario_id,
    tipo_pago,
    notas,
    total,
    fecha_solicitud,
    descripcion,
    categoria_id,
    empresa_id
  }
) {
  const q = `
    INSERT INTO solicitudes 
      (proveedor_id, usuario_id, tipo_pago, notas, total, fecha_solicitud, descripcion, categoria_id, empresa_id)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `;

  const { rows } = await client.query(q, [
    proveedor_id,
    usuario_id,
    tipo_pago,
    notas,
    total || 0,
    fecha_solicitud,
    descripcion,
    categoria_id,
    empresa_id
  ]);

  return rows[0];
}


async function update(id, { proveedor_id, total, tipo_pago, descripcion, notas, empresaId}) {
  const q = `
    UPDATE solicitudes
    SET 
      proveedor_id = $1,
      total = $2,
      tipo_pago = $3,
      descripcion = $4,
      notas = $5,
      updated_at = NOW()
    WHERE id = $6 and empresa_id = $7
    RETURNING *;
  `;

  const params = [
    proveedor_id,
    total,
    tipo_pago,
    descripcion,
    notas || null,
    id,
    empresaId
  ];

  const { rows } = await pool.query(q, params);
  return rows[0];
}


async function findAll(empresaId) {
  const q = `
    SELECT
      solicitud_id AS id,
      correlativo,
      proveedor_id,
      proveedor_nombre,
      proveedor_cai,
      categoria_nombre,
      total_solicitud AS total,
      estado,
      tipo_pago,
      numero_factura,
      fecha_factura,
      created_at
    FROM vw_resumen_solicitudes
    WHERE empresa_id = $1
    ORDER BY solicitud_id DESC
    LIMIT 100
  `;
  const { rows } = await pool.query(q, [empresaId]);
  return rows;
}



async function findById(empresaId, id) {
  const q = `
    SELECT
      s.solicitud_id AS id,
      s.correlativo,
      s.proveedor_id,
      s.proveedor_nombre,
      s.categoria_nombre,
      s.tipo_pago,
      s.total_solicitud AS total,
      s.estado,
      s.fecha_solicitud,
      s.fecha_aprobacion,
      s.empresa_id,
      s.numero_factura,
      s.fecha_factura,

      p.ruc AS proveedor_ruc,
      p.contacto AS proveedor_contacto,
      p.correo AS proveedor_correo,
      p.direccion AS proveedor_direccion,

      a.url AS archivo_url,
      a.nombre_original AS archivo_nombre,

      ap.usuario_id AS aprobado_por_id,
      ap.accion AS ultima_accion,
      ap.comentario AS comentario_aprobacion,
      ap.created_at AS fecha_aprobacion
    FROM vw_resumen_solicitud s
    LEFT JOIN proveedores p ON p.id = s.proveedor_id
    LEFT JOIN LATERAL (
      SELECT ar.*
      FROM archivos ar
      WHERE ar.entidad = 'solicitud'
        AND ar.entidad_id = s.solicitud_id
        AND ar.empresa_id = $1
      ORDER BY ar.created_at DESC
      LIMIT 1
    ) a ON true
    LEFT JOIN (
      SELECT *
      FROM aprobaciones
      WHERE solicitud_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    ) ap ON ap.solicitud_id = s.solicitud_id
    WHERE s.empresa_id = $1
      AND s.solicitud_id = $2;
  `;

  const { rows } = await pool.query(q, [empresaId, id]);
  return rows[0];
}


// Versión sin transacción (la que ya tenías)
async function updateEstado(id, estado, aprobado_por) {
  const q = `
    UPDATE solicitudes
    SET estado = $1,
        aprobado_por = $2,
        fecha_aprobacion = CASE 
          WHEN estado = 'aprobada' THEN NOW() 
          ELSE fecha_aprobacion 
        END,
        updated_at = NOW()
    WHERE id = $3
    RETURNING *;
  `;
  const { rows } = await pool.query(q, [estado, aprobado_por, id]);
  return rows[0];
}


// 🔥 NUEVA: versión para usar DENTRO de una transacción (usa client.query)
async function updateEstadoTx(client, id, estado, aprobado_por) {
  const q = `
    UPDATE solicitudes
    SET estado = $1,
        aprobado_por = $2,
        -- mismo cambio aquí: comparar la COLUMNA
        fecha_aprobacion = CASE 
          WHEN estado = 'aprobada' THEN NOW() 
          ELSE fecha_aprobacion 
        END,
        updated_at = NOW()
    WHERE id = $3
    RETURNING *;
  `;
  const { rows } = await client.query(q, [estado, aprobado_por, id]);
  return rows[0];
}

async function updateSolicitudFacturaData(id, { numero_factura, fecha_factura }) {
  const q = `
    UPDATE solicitudes
    SET 
      numero_factura = $1,
      fecha_factura = $2::date
    WHERE id = $3
    RETURNING *;
  `;

  const { rows } = await pool.query(q, [numero_factura, fecha_factura, id]);
  return rows[0];
}


// 👉 Total pagado actual por solicitud (para usar en transacción)
async function getTotalPagadoBySolicitudTx(client, solicitudId) {
  const q = `
    SELECT COALESCE(SUM(monto), 0) AS total_pagado
    FROM pagos
    WHERE solicitud_id = $1
  `;
  const { rows } = await client.query(q, [solicitudId]);
  return Number(rows[0]?.total_pagado || 0);
}

// 👉 Insertar pago dentro de una transacción
async function insertPagoTx(
  client,
  { solicitud_id, monto, fecha_pago, metodo_pago, referencia, notas, usuario_id, empresa_id }
) {
  const q = `
    INSERT INTO pagos
      (solicitud_id, monto, fecha_pago, metodo_pago, referencia, notas, usuario_id, empresa_id, created_at, updated_at)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
    RETURNING *;
  `;

  const { rows } = await client.query(q, [
    solicitud_id,
    monto,
    fecha_pago || new Date(),
    metodo_pago || "transferencia",
    referencia || null,
    notas || null,
    usuario_id,
    empresa_id, // <-- ESTO ES LO QUE HACÍA FALTA
  ]);

  return rows[0];
}


// 👉 Listar pagos de una solicitud (fuera de transacción está bien)
async function findPagosBySolicitud(empresaId, solicitudId) {
  const q = `
    SELECT 
      id,
      solicitud_id,
      monto,
      fecha_pago,
      metodo_pago,
      referencia,
      notas,
      created_at
    FROM pagos
    WHERE solicitud_id = $1 AND empresa_id = $2
    ORDER BY fecha_pago DESC, created_at DESC
  `;
  const { rows } = await pool.query(q, [solicitudId, empresaId]);
  return rows;
}


module.exports = {
  createSolicitud,
  createSolicitudTx,
  update,
  findAll,
  findById,
  updateEstado,
  updateEstadoTx, 
  updateSolicitudFacturaData,
  getTotalPagadoBySolicitudTx,
  insertPagoTx,
  findPagosBySolicitud
};
