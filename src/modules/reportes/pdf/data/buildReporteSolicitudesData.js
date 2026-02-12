/**
 * Builder oficial del Reporte de Solicitudes (PDF)
 * ------------------------------------------------
 * Responsabilidad:
 * - Ejecutar queries SIN límite (cuando se conecte SQL)
 * - Aplicar filtros reales
 * - Formatear datos para impresión
 * - Cumplir el contrato del PDF
 *
 * Este archivo NO:
 * - Renderiza HTML
 * - Conoce Puppeteer
 * - Decide layout
 */

const repo = require("../../repository");

/* ==========================
   HELPERS DE FORMATO
========================== */

function formatFecha(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("es-HN");
}

function formatMoney(value) {
  const n = Number(value || 0);
  return `L. ${n.toLocaleString("es-HN")}`;
}

/* ==========================
   BUILDER PRINCIPAL
========================== */

module.exports = async function buildReporteSolicitudesData({
  empresaId,
  filtros = {},
  metadata = {}
}) {

  /* ==========================
     1. VALIDACIONES BÁSICAS
  ========================== */

  if (!empresaId) {
    throw new Error("empresaId es obligatorio para generar el reporte PDF");
  }

  /* ==========================
     2. QUERY PRINCIPAL (SIN LIMIT)
     ⚠️ Aquí va el SQL real luego
  ========================== */

  /**
   * rows debe venir con campos CRUDOS desde BD:
   * - fechas en ISO
   * - montos numéricos
   * - nulls posibles
   *
   * Por ahora se asume que rows existe.
   */
  const rows = await repo.getReporteSolicitudesCompleto({
  empresaId,
  empresaIds: [],
  filtros
});

  /* ==========================
     3. APLICACIÓN DE FILTROS
     (backend, no frontend)
  ========================== */

  const rowsFiltrados = rows.filter(d => {
    if (filtros.estado && filtros.estado !== "Todos") {
      if (
        String(d.estado || "").toLowerCase() !==
        String(filtros.estado).toLowerCase()
      ) {
        return false;
      }
    }

    // aquí luego puedes agregar:
    // - proveedor
    // - rango fechas
    // - tipo_pago
    // - etc.

    return true;
  });

  /* ==========================
     4. CÁLCULOS DE RESUMEN
  ========================== */

  const totalSolicitadoRaw = rowsFiltrados.reduce(
    (acc, r) => acc + Number(r.total_solicitud || 0),
    0
  );

  const totalPagadoRaw = rowsFiltrados.reduce(
    (acc, r) => acc + Number(r.total_pagado || 0),
    0
  );

  const saldoPendienteRaw = totalSolicitadoRaw - totalPagadoRaw;

  /* ==========================
     5. TRANSFORMACIÓN FINAL
     (CUMPLE CONTRATO PDF)
  ========================== */

  const detalle = rowsFiltrados.map(d => ({
    correlativo: d.correlativo,
    proveedor: d.proveedor,

    fecha_solicitud: formatFecha(d.fecha_solicitud),
    fecha_factura: formatFecha(d.fecha_factura),

    numero_factura: d.numero_factura || "-",

    tipo_pago: d.tipo_pago,
    banco: d.banco || "-",
    cuenta: d.numero_cuenta || "-",

    total: formatMoney(d.total_solicitud),
    pagado: formatMoney(d.total_pagado),
    saldo: formatMoney(d.saldo),

    estado: d.estado
  }));

  /* ==========================
     6. RETORNO FINAL
     (OBJETO ÚNICO DE VERDAD)
  ========================== */

  return {
    empresa: {
      // ⚠️ luego esto debe venir de BD o contexto
      nombre: "Empresa XYZ",
      logo: null
    },

    metadata: {
      periodo: metadata.periodoLabel || "General",
      generadoEn: new Date().toISOString(),
      filtros
    },

    resumen: {
      totalSolicitado: formatMoney(totalSolicitadoRaw),
      totalPagado: formatMoney(totalPagadoRaw),
      saldoPendiente: formatMoney(saldoPendienteRaw),
      totalRegistros: detalle.length
    },

    detalle
  };
};
