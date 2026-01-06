// src/modules/pagos/pagos.repository.js

const pool = require("../../core/db");

/**
 * Obtener un pago individual por ID
 */
async function getById(id, empresaId) {
  const q = `
    SELECT 
      p.id,
      p.solicitud_id,
      p.monto,
      p.fecha_pago,
      p.metodo_pago,
      p.referencia,
      p.notas,
      p.created_at,
      p.updated_at
    FROM pagos p
    WHERE p.id = $1
      AND p.empresa_id = $2
  `;

  const { rows } = await pool.query(q, [id, empresaId]);
  return rows[0] || null;
}


/**
 * Listar pagos (opcionalmente filtrando por solicitud_id)
 * Esto NO viola la unificación, porque listar ≠ registrar.
 * Registrar solo se hace desde solicitudes.service.registrarPago
 */
async function list(filters = {}) {
  let index = 1;
  const params = [];

  let q = `
    SELECT
      p.id,
      p.solicitud_id,
      p.monto,
      p.fecha_pago,
      p.metodo_pago,
      p.referencia,
      p.notas,
      p.created_at
    FROM pagos p
    WHERE p.empresa_id = $${index++}
  `;

  params.push(filters.empresa_id);

  if (filters.solicitud_id) {
    q += ` AND p.solicitud_id = $${index++}`;
    params.push(filters.solicitud_id);
  }

  q += ` ORDER BY p.fecha_pago DESC NULLS LAST LIMIT 500`;

  const { rows } = await pool.query(q, params);
  return rows;
}


module.exports = {
  getById,
  list,
};
