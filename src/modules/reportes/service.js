const repo = require('./repository');
const assertCtx = require('../../utils/assertReporteCtx');
const PdfPrinter = require("pdfmake");
const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold"
  }
};


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

  getProveedorPerfil: async (empresaId, id) => {
    return await repo.getProveedorPerfil(id, empresaId);
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

  if (modo === "AGREGADO") {
    resumenEmpresas = await repo.getResumenPorEmpresa(empresaIds);
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
    resumenEmpresas
  };
},


// exportDetallePDF: async (ctx) => {
//   try {
//   assertCtx(ctx);

//   const { empresaId, empresaIds, filtros } = ctx;

//   const detalle = await repo.getDashboardDetalle(empresaId, empresaIds);

//   const filtrado = detalle.filter(d => {
//     if (filtros.estado && filtros.estado !== "Todos") {
//       return d.estado === filtros.estado;
//     }
//     return true;
//   });

//   }catch (err) {
//   console.error("❌ ERROR PDF SERVICE:", err);
//   throw err;
//   }
// }, 

exportReporteSolicitudesPDF: async (ctx) => {
  try {
    assertCtx(ctx);

    const generarReporteSolicitudesPDF =
      require("./pdf");

    const withTimeout = (promise, ms) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("PDF timeout")), ms)
        )
      ]);

    return await withTimeout(
      generarReporteSolicitudesPDF({
        empresaId: ctx.empresaId,
        filtros: ctx.filtros,
        metadata: ctx.metadata || {}
      }),
      15000
    );


  } catch (err) {
    console.error("❌ ERROR NUEVO PDF:", err);
    throw err;
  }
},



getReporteMensual: async (ctx, periodo) => {
  assertCtx(ctx);

  const { empresaId } = ctx;

  // 1️⃣ Obtener KPIs del mes
  const kpiQuery = `
    SELECT
      COALESCE(SUM(v.total_solicitud), 0) AS total_solicitado,
      COALESCE(SUM(v.total_pagado), 0) AS total_pagado,
      COALESCE(SUM(v.saldo_restante), 0) AS saldo_pendiente,
      COUNT(*) AS total_solicitudes
    FROM vw_total_pagado_por_solicitud v
    JOIN solicitudes s ON s.id = v.solicitud_id
    WHERE ($1 = 0 OR v.empresa_id = $1)
      AND date_trunc('month', s.fecha_solicitud)
          = to_date($2 || '-01', 'YYYY-MM-DD');
  `;

  const { rows: kpiRows } = await require('../../core/db').query(kpiQuery, [empresaId, periodo]);
  const kpisRaw = kpiRows[0] || {};

  const kpis = {
    total_solicitado: Number(kpisRaw.total_solicitado || 0),
    total_pagado: Number(kpisRaw.total_pagado || 0),
    saldo_pendiente: Number(kpisRaw.saldo_pendiente || 0),
    total_solicitudes: Number(kpisRaw.total_solicitudes || 0),
  };

  // 2️⃣ Obtener detalle del mes
  const detalle = await repo.getDashboardPorMes(empresaId, periodo);

  // 3️⃣ Calcular estados dinámicamente del mes
  const stateMap = {};
  detalle.forEach(d => {
    const estado = d.estado || "desconocido";
    stateMap[estado] = (stateMap[estado] || 0) + 1;
  });

  const states = Object.keys(stateMap).map(estado => ({
    estado,
    cnt: stateMap[estado]
  }));

  // 4️⃣ Retornar estructura consistente con dashboard
  return {
    kpis,
    monthly: [],          // no aplica en vista mensual
    providers: [],        // opcional: puedes calcular si lo necesitas
    paymentTypes: [],
    states,
    cashflow: [],
    detalle: detalle || []
  };
},



};



