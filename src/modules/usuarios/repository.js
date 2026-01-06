const pool = require('../../core/db');

async function findByEmail(email) {
  const { rows } = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id]);
  return rows[0];
}

async function create({ nombre, email, password_hash, rol }) {
  const q = `
    INSERT INTO usuarios (nombre, email, password_hash, rol)
    VALUES ($1, $2, $3, $4)
    RETURNING id, nombre, email, rol, created_at;
  `;
  const { rows } = await pool.query(q, [nombre, email, password_hash, rol]);
  return rows[0];
}

async function getEmpresasByUsuario(usuarioId) {
  const q = `
    SELECT
      e.id,
      e.nombre,
      ue.rol
    FROM usuarios_empresas ue
    JOIN empresas e ON e.id = ue.empresa_id
    WHERE ue.usuario_id = $1
  `;
  const { rows } = await pool.query(q, [usuarioId]);
  return rows;
}


// (al lado de getEmpresasByUsuario)
async function getAllEmpresas() {
  const q = `
    SELECT id, nombre
    FROM empresas
    ORDER BY nombre;
  `;
  const { rows } = await pool.query(q, []);
  return rows;
}

async function getEmpresasJerarquicas() {
  const q = `
    SELECT id, nombre, parent_id, nivel
    FROM empresas
    WHERE activo = true
    ORDER BY nombre;
  `;
  const { rows } = await pool.query(q);
  return rows;
}

async function listarUsuarios() {
  const { rows } = await pool.query(`
    SELECT id, nombre, email, rol, created_at
    FROM usuarios
    ORDER BY nombre
  `);
  return rows;
}

async function obtenerUsuario(id) {
  const { rows } = await pool.query(`
    SELECT id, nombre, email, rol
    FROM usuarios
    WHERE id = $1
  `, [id]);

  return rows[0];
}

async function setEmpresas(usuarioId, empresas = []) {
  await pool.query(
    "DELETE FROM usuarios_empresas WHERE usuario_id = $1",
    [usuarioId]
  );

  for (const empresaId of empresas) {
    if (!empresaId || isNaN(empresaId)) {
      throw new Error("empresa_id inválido: " + empresaId);
    }

    await pool.query(
      `
      INSERT INTO usuarios_empresas (usuario_id, empresa_id, rol)
      VALUES ($1, $2, 'admin')
      `,
      [usuarioId, Number(empresaId)]
    );
  }
}

async function updatePassword(id, passwordHash) {
  await pool.query(
    `
    UPDATE usuarios
    SET password_hash = $1,
        updated_at = now()
    WHERE id = $2
    `,
    [passwordHash, id]
  );
}




module.exports = {
  findByEmail,
  findById,
  create,
  getEmpresasByUsuario,
  getAllEmpresas,
  getEmpresasJerarquicas,
  listarUsuarios,
  obtenerUsuario,
  setEmpresas,
  updatePassword
};
