// src/modules/usuarios_empresas/repository.js
const pool = require('../../core/db');

async function findByUsuarioEmpresa(usuarioId, empresaId) {
  const q = `
    SELECT id, usuario_id, empresa_id, rol
    FROM usuarios_empresas
    WHERE usuario_id = $1 AND empresa_id = $2
    LIMIT 1
  `;
  const { rows } = await pool.query(q, [usuarioId, empresaId]);
  return rows[0];
}

module.exports = { findByUsuarioEmpresa };
