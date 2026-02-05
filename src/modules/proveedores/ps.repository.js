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

// ==========================
// obtener proveedor + sucursal juntos
// ==========================
async function getById(proveedorId, sucursalId) {
  const q = `
    SELECT
      ps.id AS sucursal_id,
      ps.proveedor_id,
      ps.nombre,
      ps.contacto,
      ps.correo,
      ps.direccion,
      ps.cai,
      ps.rango_factura_desde,
      ps.rango_factura_hasta,
      ps.fecha_limite_emision,
      p.ruc
    FROM proveedor_sucursales ps
    JOIN proveedores p
      ON p.id = ps.proveedor_id
    WHERE ps.id = $1
      AND ps.proveedor_id = $2;
  `;

  const { rows } = await pool.query(q, [sucursalId, proveedorId]);
  return rows[0];
}


async function update(proveedorId, sucursalId, data) {
  const q = `
    UPDATE proveedor_sucursales
    SET
      nombre = COALESCE($1, nombre),
      contacto = COALESCE($2, contacto),
      correo = COALESCE($3, correo),
      direccion = COALESCE($4, direccion),
      cai = COALESCE($5, cai),
      rango_factura_desde = COALESCE($6, rango_factura_desde),
      rango_factura_hasta = COALESCE($7, rango_factura_hasta),
      fecha_limite_emision = COALESCE($8, fecha_limite_emision)
    WHERE id = $9
      AND proveedor_id = $10
    RETURNING *;
  `;

  try {
    const { rows } = await pool.query(q, [
      data.nombre,
      data.contacto,
      data.correo,
      data.direccion,
      data.cai,
      data.rango_factura_desde,
      data.rango_factura_hasta,
      parseFechaDDMMYY(data.fecha_limite_emision),
      sucursalId,
      proveedorId
    ]);

    return rows[0];

  } catch (err) {
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
  create,
  getById,
  update
};
