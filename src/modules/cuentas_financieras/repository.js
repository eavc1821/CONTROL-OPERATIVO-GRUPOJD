const pool = require("../../core/db");

async function listByMetodoPago(empresaId, metodo_pago) {
  const q = `
    SELECT id, nombre
    FROM cuentas_financieras
    WHERE empresa_id = $1
      AND metodo_pago = $2
      AND activo = true
    ORDER BY nombre
  `;

  const { rows } = await pool.query(q, [empresaId, metodo_pago]);
  return rows;
}

async function listBancosByMetodo(empresaId, metodo_pago) {
  const q = `
    SELECT DISTINCT banco
    FROM cuentas_financieras
    WHERE empresa_id = $1
      AND metodo_pago = $2
      AND activo = true
      AND banco IS NOT NULL
    ORDER BY banco
  `;
  const { rows } = await pool.query(q, [empresaId, metodo_pago]);
  return rows.map(r => r.banco);
}

async function listCuentasByBanco(empresaId, metodo_pago, banco) {
  const q = `
    SELECT id, nombre, numero_cuenta
    FROM cuentas_financieras
    WHERE empresa_id = $1
      AND metodo_pago = $2
      AND banco = $3
      AND activo = true
    ORDER BY nombre
  `;
  const { rows } = await pool.query(q, [empresaId, metodo_pago, banco]);
  return rows;
}



module.exports = {
  listByMetodoPago,
  listBancosByMetodo,
  listCuentasByBanco
};
