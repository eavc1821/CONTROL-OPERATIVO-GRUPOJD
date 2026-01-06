module.exports = function assertPagoCtx(ctx) {
  if (!ctx || typeof ctx !== "object") {
    throw new Error("Contexto de pago inválido");
  }

  if (typeof ctx.empresaId !== "number" || Number.isNaN(ctx.empresaId)) {
    throw new Error("empresaId inválido");
  }

  if (ctx.usuarioId !== undefined) {
    if (typeof ctx.usuarioId !== "number" || Number.isNaN(ctx.usuarioId)) {
      throw new Error("usuarioId inválido");
    }
  }
};
