const repo = require("./repository");

async function list(ctx, metodo_pago) {
  if (!metodo_pago) {
    throw new Error("metodo_pago es obligatorio");
  }

  return repo.listByMetodoPago(ctx.empresaId, metodo_pago);
}

module.exports = {
  list
};
