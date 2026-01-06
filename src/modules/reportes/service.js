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
  const monthly = await repo.getMensual(empresaId, empresaIds);
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


exportDetallePDF:async (ctx) => {
  assertCtx(ctx);

  const { empresaId, empresaIds, filtros } = ctx;

  const detalle = await repo.getDashboardDetalle(empresaId, empresaIds);

  // Aplicar filtros aquí (estado, fechas, etc.)
  const filtrado = detalle.filter(d => {
    if (filtros.estado && filtros.estado !== "Todos") {
      if (d.estado !== filtros.estado) return false;
    }
    return true;
  });

  const body = [
    [
      "Correlativo",
      "Proveedor",
      "Factura",
      "Fecha factura",
      "Tipo pago",
      "Total",
      "Pagado",
      "Saldo",
      "Estado"
    ],
    ...filtrado.map(d => ([
      d.correlativo,
      d.proveedor,
      d.numero_factura || "-",
      d.fecha_factura || "-",
      d.tipo_pago,
      d.total_solicitud,
      d.total_pagado,
      d.saldo,
      d.estado
    ]))
  ];

  const docDefinition = {
    content: [
      { text: filtros.empresaNombre, style: "header" },
      {
        text: `Reporte de solicitudes - ${filtros.periodo}`,
        margin: [0, 0, 0, 10]
      },
      {
        table: { headerRows: 1, widths: ["*", "*", "*", "*", "*", "*", "*", "*", "*"], body }
      }
    ],
    styles: {
      header: { fontSize: 16, bold: true }
    }
  };

  const printer = new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  const chunks = [];
  pdfDoc.on("data", c => chunks.push(c));
  pdfDoc.end();

  return Buffer.concat(chunks);
}

};
