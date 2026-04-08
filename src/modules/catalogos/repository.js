const pool = require("../../core/db");

async function getClientesIngresos() {
  const { rows } = await pool.query(`
    SELECT id, nombre
    FROM clientes_ingresos
    WHERE activo = true
    ORDER BY nombre
  `);

  return rows;
}

async function getOperadores() {
  const { rows } = await pool.query(`
    SELECT id, nombre
    FROM operadores_transporte
    WHERE activo = true
    ORDER BY nombre
  `);

  return rows;
}

async function getCisternas() {
  const { rows } = await pool.query(`
    SELECT id, placa
    FROM cisternas
    WHERE activo = true
    ORDER BY placa
  `);

  return rows;
}

module.exports = {
  getClientesIngresos,
  getOperadores,
  getCisternas,
};