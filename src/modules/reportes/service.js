const repo = require('./repository');
const assertCtx = require('../../utils/assertReporteCtx');
const excel = require('./excel');

module.exports = {

  // =========================
  // BÁSICOS
  // =========================
  getResumen: async (ctx) => {
  assertCtx(ctx);
  return repo.getResumen(ctx.empresaId);
},
  getPorProveedor: (empresaId) => repo.getPorProveedor(empresaId),
  getPorTipoPago: async (ctx) => {
    assertCtx(ctx);
    return repo.getPorTipoPago(ctx.empresaId);
  },
  getMensual: async (ctx) => {
  assertCtx(ctx);
  return repo.getMensual(ctx.empresaId, ctx.empresaIds);
},
  getRanking: async (ctx) => {
  assertCtx(ctx);
  return repo.getRanking(ctx.empresaId, ctx.empresaIds);
},
  getMesesDisponibles: async (ctx) => {
  assertCtx(ctx);
  return repo.getMesesDisponibles(ctx.empresaId);
},

  getResumenPorSolicitud: (empresaId, solicitudId) =>
    repo.getResumenPorSolicitud(empresaId, solicitudId),

  getProveedorPerfil: async (empresaId, id, filtros) => {
    return await repo.getProveedorPerfil(id, empresaId, filtros);
  },

  // =========================
  // REPORTES
  // =========================
  getProveedoresReporte: async (ctx) => {
  assertCtx(ctx);

  const { empresaId, empresaIds, filtros } = ctx;

  const proveedores = await repo.getProveedoresReporte({
    empresaId,
    empresaIds,
    filtros
  });

  const total_pagado = await repo.getTotalPagadoDelMes(
    empresaId,
    filtros?.mes
  );

  return {
    total_pagado_mes: total_pagado,
    proveedores
  };
},


  // =========================
  // DASHBOARD POR MES
  // =========================
  getDashboardPorMes: async (ctx, periodo) => {
  assertCtx(ctx);

  const { empresaId } = ctx;

  const resumen = await repo.getDashboardPorMes(empresaId, periodo);

  const total_solicitado = resumen.reduce((s, r) => s + Number(r.total || 0), 0);
  const total_pagado = resumen.reduce((s, r) => s + Number(r.pagado || 0), 0);
  const saldo = resumen.reduce((s, r) => s + Number(r.saldo || 0), 0);

  return {
    kpis: {
      total_solicitado,
      total_pagado,
      saldo_pendiente: saldo,
      total_solicitudes: resumen.length
    },
    detalle: resumen
  };
},


  // =========================
  // DASHBOARD GENERAL
  // =========================
getDashboard: async (ctx) => {
  assertCtx(ctx);

  // 🔹 Desestructurar primero (OBLIGATORIO)
  const { empresaId, empresaIds, modo } = ctx;

  // 🔹 Resumen por empresa (solo PADRE)
  let resumenEmpresas = [];
  let desempenoEmpresas = [];

  if (modo === "AGREGADO") {
    resumenEmpresas = await repo.getResumenPorEmpresa(empresaIds);
    desempenoEmpresas = await repo.getDesempenoEmpresas(empresaIds);
  }

  // 🔹 Datos comunes (HIJA y PADRE)
  const resumen = await repo.getResumen(empresaId);
  const kpis = await repo.getDashboardKPIs(empresaId, empresaIds);
  const limite = modo === "AGREGADO" ? 12 : 6;
const monthly = await repo.getMensual(empresaId, empresaIds, limite);
  const providers = await repo.getPorProveedor(empresaId, empresaIds);
  const paymentTypes = await repo.getTotalesPorTipoPago(empresaId);
  const ranking = await repo.getRanking(empresaId, empresaIds);
  const cashflow = await repo.getCashflow(empresaId, empresaIds);

  // 🔹 Estados de solicitudes (agregado)
  const stateMap = {};
  resumen.forEach((r) => {
    const estado = r.estado || "desconocido";
    stateMap[estado] = (stateMap[estado] || 0) + 1;
  });

  const states = Object.keys(stateMap).map((estado) => ({
    estado,
    cnt: stateMap[estado]
  }));

  // 🔹 Detalle SOLO para empresa HIJA
  let detalle = [];

  if (modo !== "AGREGADO") {
    detalle = await repo.getDashboardDetalle(empresaId, empresaIds);
  }

  // 🔹 Respuesta final
  return {
    modo,
    kpis,
    monthly,
    providers,
    paymentTypes,
    states,
    ranking,
    cashflow,
    detalle,
    resumenEmpresas,
    desempenoEmpresas
  };
},



getReporteRango: async (ctx) => {
  assertCtx(ctx);

  const { empresaId, empresaIds, desde, hasta, estado, proveedor } = ctx;

  if (!desde || !hasta) {
    throw new Error("Rango de fechas inválido");
  }

  return await repo.getReporteRango({
    empresaId,
    empresaIds,
    desde,
    hasta,
    estado,
    proveedor
  });
},


exportReporteRangoExcel: async (ctx) => {

  assertCtx(ctx);

  // =====================================
  // 1️⃣ Nombre empresa
  // =====================================
  const empresaNombre = await repo.getEmpresaNombre(ctx.empresaId);

  // =====================================
  // 2️⃣ Obtener KPIs (query normal)
  //    ⚠️ SOLO usamos KPIs, no detalle
  // =====================================
  const resumen = await repo.getReporteRango({
    empresaId: ctx.empresaId,
    empresaIds: ctx.empresaIds,
    desde: ctx.desde,
    hasta: ctx.hasta,
    estado: ctx.estado,
    proveedor: ctx.proveedor
  });

  // =====================================
  // 3️⃣ Stream REAL del detalle
  // =====================================
  const rowStream = await repo.getReporteRangoStream({
    empresaId: ctx.empresaId,
    empresaIds: ctx.empresaIds,
    desde: ctx.desde,
    hasta: ctx.hasta,
    estado: ctx.estado,
    proveedor: ctx.proveedor
  });

  // =====================================
  // 4️⃣ Generar Excel streaming
  // =====================================
  await excel(
  {
    empresaNombre,
    desde: ctx.desde,
    hasta: ctx.hasta,
    filtros: ctx.filtros,
    saldo_inicial: resumen.saldo_inicial,

    saldo_inicial_historico: resumen.saldo_inicial_historico,
    pagos_mes_anterior: resumen.pagos_mes_anterior,
    cierre_mes: resumen.cierre_mes,
    
    kpis: resumen.kpis,
    rowStream
  },
  ctx.res
);
},


getDashboardTransporte: async (ctx, query) => {
  assertCtx(ctx);

  const { empresaId } = ctx;

  // ✅ RANGO DE FECHAS (obligatorio)
  const desde = query?.desde || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const hasta = query?.hasta || new Date();

  // ⚠️ convertir a formato YYYY-MM-DD
  const formatDate = (d) => {
    const date = new Date(d);
    return date.toISOString().split("T")[0];
  };

  const desdeFmt = formatDate(desde);
  const hastaFmt = formatDate(hasta);

  // ✅ KPIs principales
  const resumen = await repo.getResumenTransporte(
    empresaId,
    desdeFmt,
    hastaFmt
  );

  // ✅ Serie temporal
  const viajesPorDia = await repo.getViajesPorDia(
    empresaId,
    desdeFmt,
    hastaFmt
  );

  // calcular rango anterior
    const desdeDate = new Date(desdeFmt);
    const hastaDate = new Date(hastaFmt);

    const diffTime = hastaDate - desdeDate;

    const prevHasta = new Date(desdeDate - 1);
    const prevDesde = new Date(prevHasta - diffTime);

    const format = (d) => d.toISOString().split("T")[0];

    const prevResumen = await repo.getResumenTransporte(
      empresaId,
      format(prevDesde),
      format(prevHasta)
    );

  return {
    rango: {
      desde: desdeFmt,
      hasta: hastaFmt
    },

    kpis: {
      total_viajes: Number(resumen.total_viajes || 0),
      total_ingresos: Number(resumen.total_ingresos || 0),
      total_gastos: Number(resumen.total_gastos || 0),
      total_viaticos: Number(resumen.total_viaticos || 0),
      utilidad:
        Number(resumen.total_ingresos || 0) -
        Number(resumen.total_gastos || 0),

      // 🔥 KPI extra útil
      ingreso_promedio_por_viaje:
        resumen.total_viajes > 0
          ? Number(resumen.total_ingresos) / Number(resumen.total_viajes)
          : 0,
    },

    comparativo: {
      ingresos: Number(prevResumen.total_ingresos || 0),
      gastos: Number(prevResumen.total_gastos || 0),
      utilidad:
        Number(prevResumen.total_ingresos || 0) -
        Number(prevResumen.total_gastos || 0),
    },

    // 📊 para gráficas
    viajesPorDia
  };
},

};

