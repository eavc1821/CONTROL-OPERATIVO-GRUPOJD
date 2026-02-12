module.exports = function assertReporteCtx(ctx) {
  if (!ctx || typeof ctx !== "object") {
    throw new Error("Contexto de reporte inválido");
  }

  // empresaId obligatorio
  if (typeof ctx.empresaId !== "number" || Number.isNaN(ctx.empresaId)) {
    throw new Error("empresaId inválido");
  }

  // empresaIds obligatorio (array)
  if (!Array.isArray(ctx.empresaIds)) {
    throw new Error("empresaIds debe ser array");
  }

  // modo opcional
  if (
    ctx.modo !== undefined &&
    !["GENERAL", "EMPRESA"].includes(ctx.modo)
  ) {
    throw new Error("modo inválido");
  }

  // filtros opcionales
  if (ctx.filtros !== undefined && typeof ctx.filtros !== "object") {
    throw new Error("filtros inválidos");
  }

  // ---- VALIDACIONES SEMÁNTICAS ----

  if (ctx.filtros?.periodo !== undefined) {
    if (typeof ctx.filtros.periodo !== "string") {
      throw new Error("filtros.periodo debe ser string YYYY-MM");
    }

    // YYYY-MM estricto
    if (!/^\d{4}-\d{2}$/.test(ctx.filtros.periodo)) {
      throw new Error(
        `filtros.periodo inválido (${ctx.filtros.periodo}), se espera YYYY-MM`
      );
    }
  }

  // metadata opcional (solo visual)
  if (ctx.metadata !== undefined && typeof ctx.metadata !== "object") {
    throw new Error("metadata inválida");
  }
};
