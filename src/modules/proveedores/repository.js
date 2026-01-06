const pool = require('../../core/db');

async function getAll() {
  const q = `
    SELECT
      p.id,
      p.nombre,
      p.ruc,
      p.cai,
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
      p.cai,
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
      cai,
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
      p.cai,
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


async function create(data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ crear proveedor GLOBAL (SIN CAI)
const proveedorRes = await client.query(
  `
  INSERT INTO proveedores (nombre, ruc, contacto, correo, direccion, categoria_id, cai)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING id, nombre, ruc, contacto, correo, direccion, categoria_id, cai, created_at
  `,
  [
    data.nombre,
    data.ruc,
    data.contacto,
    data.correo,
    data.direccion,
    data.categoria_id,
    data.cai
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
    throw err;
  } finally {
    client.release();
  }
}


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
      cai = COALESCE($7, cai),
      updated_at = NOW()
    WHERE id = $8
    RETURNING *;
  `;

  const { rows } = await pool.query(q, [
    payload.nombre,
    payload.ruc,
    payload.contacto,
    payload.correo,
    payload.direccion,
    payload.categoria_id,
    payload.cai,
    id
  ]);

  return rows[0];
}



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



module.exports = { getAll, getByEmpresa, getById, getByEmpresaAndId, create, update, remove };
