const pool = require("../../core/db");

function parseFechaDDMMYY(value) {
  if (!value || typeof value !== "string") return null;

  const parts = value.split("/");
  if (parts.length !== 3) return null;

  const [d, m, y] = parts;
  return new Date(`20${y}-${m}-${d}`);
}

// ==========================
// Queries
// ==========================
async function getByProveedor(proveedorId) {
  const q = `
    SELECT
      id,
      proveedor_id,
      nombre,
      contacto,
      correo,
      direccion,
      cai,
      rango_factura_desde,
      rango_factura_hasta,
      fecha_limite_emision,
      created_at
    FROM proveedor_sucursales
    WHERE proveedor_id = $1
    ORDER BY created_at;
  `;
  const { rows } = await pool.query(q, [proveedorId]);
  return rows;
}

// ==========================
// Create
// ==========================
async function create(data) {
  const q = `
    INSERT INTO proveedor_sucursales (
      proveedor_id,
      nombre,
      contacto,
      correo,
      direccion,
      cai,
      rango_factura_desde,
      rango_factura_hasta,
      fecha_limite_emision
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `;

  try {
    const { rows } = await pool.query(q, [
      data.proveedor_id,
      data.nombre,
      data.contacto,
      data.correo,
      data.direccion,
      data.cai,
      data.rango_factura_desde,
      data.rango_factura_hasta,
      parseFechaDDMMYY(data.fecha_limite_emision)
    ]);

    return rows[0];

  } catch (err) {
    // 🔒 CAI duplicado
    if (err.code === "23505") {
      const error = new Error("El CAI ya está registrado para este proveedor");
      error.code = "CAI_DUPLICADO";
      throw error;
    }
    throw err;
  }
}

module.exports = {
  getByProveedor,
  create
};
