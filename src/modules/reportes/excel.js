const ExcelJS = require("exceljs");

function money(value) {
  return Number(value || 0);
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-HN");
}

module.exports = async function generarReporteExcel({
  empresaNombre,
  desde,
  hasta,
  kpis,
  detalle
}) {

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Reporte Solicitudes");

  // =============================
  // ESTILOS BASE
  // =============================
  const HEADER_BG = "1E3A8A";
  const TABLE_BG = "0F172A";

  ws.views = [{ state: "frozen", ySplit: 12 }];

  // =============================
  // HEADER
  // =============================
  ws.mergeCells("A1:L1");
  ws.getCell("A1").value = empresaNombre || "Empresa";
  ws.getCell("A1").font = { size: 18, bold: true, color: { argb: "FFFFFFFF" }};
  ws.getCell("A1").alignment = { horizontal: "center" };
  ws.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_BG }
  };

  ws.mergeCells("A2:L2");
  ws.getCell("A2").value = "Reporte de Solicitudes";
  ws.getCell("A2").font = { size: 14, bold: true };
  ws.getCell("A2").alignment = { horizontal: "center" };

  ws.mergeCells("A3:L3");
  ws.getCell("A3").value = `Periodo: ${desde} → ${hasta}`;
  ws.getCell("A3").alignment = { horizontal: "center" };

  ws.mergeCells("A4:L4");
  ws.getCell("A4").value = `Generado: ${new Date().toLocaleString("es-HN")}`;
  ws.getCell("A4").alignment = { horizontal: "center" };

  // =============================
  // KPIS
  // =============================
  ws.addRow([]);
  ws.addRow([
    "Total solicitado",
    "Total pagado",
    "Saldo pendiente",
    "Solicitudes"
  ]);

  const kpiHeaderRow = ws.lastRow;
  kpiHeaderRow.eachCell(c => {
    c.font = { bold: true };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "E2E8F0" }
    };
    c.alignment = { horizontal: "center" };
  });

  ws.addRow([
    money(kpis.total_solicitado),
    money(kpis.total_pagado),
    money(kpis.saldo_pendiente),
    kpis.total_solicitudes
  ]);

  const kpiValues = ws.lastRow;
  kpiValues.eachCell((c, i) => {
    if (i <= 3) {
      c.numFmt = '"L." #,##0.00';
    }
    c.alignment = { horizontal: "center" };
  });

  ws.addRow([]);

  // =============================
  // TABLA HEADER
  // =============================
  const tableHeaders = [
    "Correlativo",
    "Proveedor",
    "Fecha solicitud",
    "Fecha factura",
    "Factura",
    "Tipo pago",
    "Banco",
    "Cuenta",
    "Total",
    "Pagado",
    "Saldo",
    "Estado"
  ];

  ws.addRow(tableHeaders);

  const headerRow = ws.lastRow;

  headerRow.eachCell(c => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" }};
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: TABLE_BG }
    };
    c.alignment = { horizontal: "center" };
  });

  // =============================
  // DATA
  // =============================
  detalle.forEach(d => {

    const row = ws.addRow([
      d.correlativo,
      d.proveedor,
      formatDate(d.fecha_solicitud),
      formatDate(d.fecha_factura),
      d.numero_factura || "-",
      d.tipo_pago,
      d.banco,
      d.numero_cuenta,
      money(d.total_solicitud),
      money(d.total_pagado),
      money(d.saldo),
      d.estado
    ]);

    // formato moneda
    row.getCell(9).numFmt = '"L." #,##0.00';
    row.getCell(10).numFmt = '"L." #,##0.00';
    row.getCell(11).numFmt = '"L." #,##0.00';

    // color por estado
    const estado = String(d.estado || "").toLowerCase();

    if (estado === "pagada") {
      row.getCell(12).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "DCFCE7" }
      };
    }

    if (estado === "aprobada") {
      row.getCell(12).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FEF9C3" }
      };
    }
  });

  // =============================
  // AUTOFILTER
  // =============================
  ws.autoFilter = {
    from: "A12",
    to: "L12"
  };

  // =============================
  // AUTO WIDTH COLUMNAS
  // =============================
  ws.columns.forEach(column => {
    let max = 12;
    column.eachCell({ includeEmpty: true }, cell => {
      const len = (cell.value ? cell.value.toString().length : 0);
      if (len > max) max = len;
    });
    column.width = max + 2;
  });

  return wb;
};