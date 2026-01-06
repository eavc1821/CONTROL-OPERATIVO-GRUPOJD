const pool = require("../../core/db");

async function getEmpresasJerarquicas() {
  const q = `
    SELECT id, nombre, parent_id, nivel
    FROM empresas
    ORDER BY nombre
  `;
  const { rows } = await pool.query(q);
  return rows;
}

async function getEmpresasByUsuario(usuarioId) {
  const q = `
    SELECT e.id, e.nombre, e.parent_id, e.nivel
    FROM empresas e
    INNER JOIN usuarios_empresas ue ON ue.empresa_id = e.id
    WHERE ue.usuario_id = $1
    ORDER BY e.nombre
  `;
  const { rows } = await pool.query(q, [usuarioId]);
  return rows;
}

async function getEmpresasConDescendientesByUsuario(usuarioId) {
  const q = `
    WITH RECURSIVE empresa_tree AS (
      SELECT e.id, e.nombre, e.parent_id, e.nivel
      FROM empresas e
      JOIN usuarios_empresas ue ON ue.empresa_id = e.id
      WHERE ue.usuario_id = $1

      UNION ALL

      SELECT e2.id, e2.nombre, e2.parent_id, e2.nivel
      FROM empresas e2
      JOIN empresa_tree et ON et.id = e2.parent_id
    )
    SELECT DISTINCT *
    FROM empresa_tree
    ORDER BY nombre;
  `;

  const { rows } = await pool.query(q, [usuarioId]);
  return rows;
}



module.exports = {
  getEmpresasJerarquicas,
  getEmpresasByUsuario,
  getEmpresasConDescendientesByUsuario
};
