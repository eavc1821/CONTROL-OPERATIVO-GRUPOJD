const repo = require("./repository");
const pool = require("../../core/db");

/**
 * 🔑 Resuelve la empresa financiera efectiva.
 *
 * Regla:
 * - Si la empresa tiene parent_id → usa las cuentas del padre
 * - Si NO tiene parent_id → usa sus propias cuentas
 */
async function resolveEmpresaFinancieraId(empresaId) {
  const q = `
    SELECT
      COALESCE(parent_id, id) AS empresa_financiera_id
    FROM empresas
    WHERE id = $1
  `;

  const { rows } = await pool.query(q, [empresaId]);

  if (!rows[0]) {
    throw new Error("Empresa no encontrada");
  }

  return rows[0].empresa_financiera_id;
}

/**
 * Listar cuentas por método de pago
 */
async function list(ctx, metodo_pago) {
  if (!metodo_pago) {
    throw new Error("metodo_pago es obligatorio");
  }

  const empresaFinancieraId =
    await resolveEmpresaFinancieraId(ctx.empresaId);

  return repo.listByMetodoPago(
    empresaFinancieraId,
    metodo_pago
  );
}

/**
 * Listar bancos por método de pago
 */
async function listBancos(empresaId, metodo_pago) {
  if (!metodo_pago) {
    throw new Error("metodo_pago es obligatorio");
  }

  const empresaFinancieraId =
    await resolveEmpresaFinancieraId(empresaId);

  return repo.listBancosByMetodo(
    empresaFinancieraId,
    metodo_pago
  );
}

/**
 * Listar cuentas por banco
 */
async function listCuentas(empresaId, metodo_pago, banco) {
  if (!metodo_pago || !banco) {
    throw new Error("metodo_pago y banco son obligatorios");
  }

  const empresaFinancieraId =
    await resolveEmpresaFinancieraId(empresaId);

  return repo.listCuentasByBanco(
    empresaFinancieraId,
    metodo_pago,
    banco
  );
}

module.exports = {
  list,
  listBancos,
  listCuentas
};
