const repo = require("./repository");

async function list(ctx, metodo_pago) {
  if (!metodo_pago) {
    throw new Error("metodo_pago es obligatorio");
  }

  return repo.listByMetodoPago(ctx.empresaId, metodo_pago);
}

async function listBancos(empresaId, metodo_pago) {
  if (!metodo_pago) {
    throw new Error("metodo_pago es obligatorio");
  }

  return repo.listBancosByMetodo(empresaId, metodo_pago);
}

async function listCuentas(empresaId, metodo_pago, banco) {
  if (!metodo_pago || !banco) {
    throw new Error("metodo_pago y banco son obligatorios");
  }

  return repo.listCuentasByBanco(empresaId, metodo_pago, banco);
}

module.exports = {
  list,
  listBancos,
  listCuentas
};
