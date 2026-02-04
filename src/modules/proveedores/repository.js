const pool = require('../../core/db');

function parseFechaDDMMYY(value) {
  if (!value || typeof value !== "string") return null;

  const parts = value.split("/");
  if (parts.length !== 3) return null;

  const [d, m, y] = parts;
  if (!d || !m || !y) return null;

  return new Date(`20${y}-${m}-${d}`);
}

// ==========================
// Queries
// ==========================
async function getAll() {
  const q = `
    SELECT
      p.id,
      p.nombre,
      p.ruc,
      p.contacto,
      p.correo,
      p.direccion,
      p.created_at
    FROM proveedores p
    ORDER BY p.nombre;
  `;
  const { rows } = await pool.query(q);
  return rows;
}

async function getByEmpresa(empresaId) {
  const q = `
    SELECT
      p.id,
      p.nombre,
      p.ruc,
      p.contacto,
      p.correo,
      p.direccion,
      p.categoria_id,
      ep.activo
    FROM proveedores p
    JOIN empresas_proveedores ep
      ON ep.proveedor_id = p.id
    WHERE ep.empresa_id = $1
      AND ep.activo = true
    ORDER BY p.nombre;
  `;
  const { rows } = await pool.query(q, [empresaId]);
  return rows;
}

async function getById(id) {
  const q = `
    SELECT
      id,
      nombre,
      ruc,
      contacto,
      correo,
      direccion,
      categoria_id,
      created_at
    FROM proveedores
    WHERE id = $1;
  `;
  const { rows } = await pool.query(q, [id]);
  return rows[0];
}

async function getByEmpresaAndId(empresaId, proveedorId) {
  const q = `
    SELECT
      p.id,
      p.nombre,
      p.ruc,
      p.contacto,
      p.correo,
      p.direccion,
      p.categoria_id,
      ep.activo
    FROM proveedores p
    JOIN empresas_proveedores ep
      ON ep.proveedor_id = p.id
    WHERE ep.empresa_id = $1
      AND p.id = $2;
  `;
  const { rows } = await pool.query(q, [empresaId, proveedorId]);
  return rows[0];
}

// ✅ NUEVO (mínimo, necesario)
async function getByRuc(ruc) {
  const { rows } = await pool.query(
    `SELECT * FROM proveedores WHERE ruc = $1`,
    [ruc]
  );
  return rows[0];
}

// ==========================
// Create
// ==========================
async function create(data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ✅ crear proveedor GLOBAL (SIN CAI / SIN fiscalidad)
    const proveedorRes = await client.query(
      `
      INSERT INTO proveedores (
        nombre,
        ruc,
        contacto,
        correo,
        direccion,
        categoria_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        nombre,
        ruc,
        contacto,
        correo,
        direccion,
        categoria_id,
        created_at
      `,
      [
        data.nombre,
        data.ruc,
        data.contacto,
        data.correo,
        data.direccion,
        data.categoria_id
      ]
    );

    const proveedor = proveedorRes.rows[0];

    await client.query(
      `
      INSERT INTO empresas_proveedores (proveedor_id, empresa_id, activo)
      VALUES ($1, $2, true)
      `,
      [proveedor.id, data.empresa_id]
    );

    await client.query("COMMIT");
    return proveedor;

  } catch (err) {
    await client.query("ROLLBACK");

    if (err.code === "23505") {
      throw new Error("El proveedor ya existe");
    }

    throw err;
  } finally {
    client.release();
  }
}
//comentario
// ==========================
// Update
// ==========================
async function update(id, payload) {
  const q = `
    UPDATE proveedores
    SET
      nombre = COALESCE($1, nombre),
      ruc = COALESCE($2, ruc),
      contacto = COALESCE($3, contacto),
      correo = COALESCE($4, correo),
      direccion = COALESCE($5, direccion),
      categoria_id = COALESCE($6, categoria_id),
      updated_at = NOW()
    WHERE id = $7
    RETURNING *;
  `;

  const { rows } = await pool.query(q, [
    payload.nombre,
    payload.ruc,
    payload.contacto,
    payload.correo,
    payload.direccion,
    payload.categoria_id,
    id
  ]);

  return rows[0];
}

// ==========================
// Remove
// ==========================
async function remove(empresaId, proveedorId) {
  const q = `
    UPDATE empresas_proveedores
    SET activo = false
    WHERE empresa_id = $1
      AND proveedor_id = $2
    RETURNING proveedor_id;
  `;
  const { rows } = await pool.query(q, [empresaId, proveedorId]);
  return rows[0];
}

async function ensureEmpresaProveedor(proveedorId, empresaId) {
  await pool.query(
    `
    INSERT INTO empresas_proveedores (proveedor_id, empresa_id, activo)
    VALUES ($1, $2, true)
    ON CONFLICT (proveedor_id, empresa_id)
    DO UPDATE SET activo = true
    `,
    [proveedorId, empresaId]
  );
}

async function listForUI() {
  const q = `
    SELECT
      p.id AS proveedor_id,
      ps.id AS sucursal_id,
      p.nombre,
      p.ruc,
      p.contacto,
      p.correo,
      ps.cai,
      ps.fecha_limite_emision,
      ps.rango_factura_desde,
      ps.rango_factura_hasta
    FROM proveedores p
    JOIN proveedor_sucursales ps
      ON ps.proveedor_id = p.id
    ORDER BY p.nombre, ps.created_at;
  `;

  const { rows } = await pool.query(q);
  return rows;
}




module.exports = {
  getAll,
  getByEmpresa,
  getById,
  getByEmpresaAndId,
  getByRuc,   
  create,
  update,
  remove,
  ensureEmpresaProveedor,
  listForUI
};
