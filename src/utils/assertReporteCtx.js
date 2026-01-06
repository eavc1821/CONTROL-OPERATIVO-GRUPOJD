module.exports = function assertReporteCtx(ctx) {
  if (!ctx || typeof ctx !== 'object') {
    throw new Error('Contexto de reporte inválido');
  }

  // empresaId SIEMPRE obligatorio
  if (typeof ctx.empresaId !== 'number' || Number.isNaN(ctx.empresaId)) {
    throw new Error('empresaId inválido');
  }

  // empresaIds SIEMPRE array (aunque esté vacío)
  if (!Array.isArray(ctx.empresaIds)) {
    throw new Error('empresaIds debe ser array');
  }

  // modo ES OPCIONAL, pero si viene, debe ser válido
  if (
    ctx.modo !== undefined &&
    !['GENERAL', 'EMPRESA'].includes(ctx.modo)
  ) {
    throw new Error('modo inválido');
  }

  // filtros opcionales
  if (ctx.filtros && typeof ctx.filtros !== 'object') {
    throw new Error('filtros inválidos');
  }
};
