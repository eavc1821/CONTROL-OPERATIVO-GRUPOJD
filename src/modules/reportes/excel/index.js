const ExcelJS = require("exceljs");
const styles = require("./styles");
const { formatDDMMYY } = require("./utils");
const svgToPngBuffer = require("./chartImage");
const layout = require("./layout");

module.exports = async function buildExcel(data) {

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Reporte");

  // ====================================
  // CURSOR DINÁMICO (AUTO LAYOUT)
  // ====================================
  let currentRow = 1;

  // ====================================
  // HEADER
  // ====================================

  ws.mergeCells("A1:L1");
  ws.getCell("A1").value = data.empresaNombre || "Empresa";
  ws.getCell("A1").font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  ws.getCell("A1").fill = styles.headerBlue;
  ws.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells("A2:L2");
  ws.getCell("A2").value = "Reporte de Solicitudes";
  ws.getCell("A2").alignment = { horizontal: "center" };
  ws.getCell("A2").font = { size: 13, bold: true };

  // ⚠️ FIX IMPORTANTE (tenías A3:L2)
  ws.mergeCells("A3:L3");
  ws.getCell("A3").value =
    `Periodo: ${formatDDMMYY(data.desde)} - ${formatDDMMYY(data.hasta)}`;
  ws.getCell("A3").alignment = { horizontal: "center" };

  ws.mergeCells("A4:L4");
  ws.getCell("A4").value =
    `Generado: ${formatDDMMYY(new Date())}`;
  ws.getCell("A4").alignment = { horizontal: "center" };

  ws.mergeCells("A5:L5");
  ws.getCell("A5").value =
    `Filtros → Estado: ${data.filtros?.estado || "Todos"} | Proveedor: ${data.filtros?.proveedor || "Todos"}`;
  ws.getCell("A5").alignment = { horizontal: "center" };

  currentRow += layout.HEADER_HEIGHT;

  // ====================================
  // KPIs
  // ====================================

  const kpis = [
    ["Total solicitado", data.kpis?.total_solicitado, "FDE68A"],
    ["Total pagado", data.kpis?.total_pagado, "86EFAC"],
    ["Saldo pendiente", data.kpis?.saldo_pendiente, "FCA5A5"],
    ["Solicitudes", data.kpis?.total_solicitudes, "93C5FD"]
  ];

  let col = 1;

  kpis.forEach(k => {

    ws.mergeCells(currentRow, col, currentRow + 1, col + 2);

    const cell = ws.getCell(currentRow, col);

    cell.value =
      `${k[0]}\n${k[0] === "Solicitudes"
        ? Number(k[1] || 0)
        : `L. ${Number(k[1] || 0).toLocaleString()}`
      }`;

    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true
    };

    cell.font = { bold: true, size: 13 };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: k[2] }
    };

    col += 3;
  });

  currentRow += layout.KPI_HEIGHT;

  // ====================================
  // CHARTS (AUTO-LAYOUT INTELIGENTE)
  // ====================================

  let chartsInserted = 0;
  const chartStartRow = currentRow;

  // TOP PROVEEDORES
  if (data.charts?.providers) {

    const buffer = await svgToPngBuffer(data.charts.providers);

    if (buffer) {

      const imageId = wb.addImage({
        buffer,
        extension: "png"
      });

      ws.addImage(imageId, {
        tl: { col: 0, row: chartStartRow },
        ext: { width: 500, height: 280 }
      });

      chartsInserted++;
    }
  }

  // ESTADOS
  if (data.charts?.states) {

    const buffer = await svgToPngBuffer(data.charts.states);

    if (buffer) {

      const imageId = wb.addImage({
        buffer,
        extension: "png"
      });

      ws.addImage(imageId, {
        tl: { col: chartsInserted ? 6 : 0, row: chartStartRow },
        ext: { width: 400, height: 280 }
      });

      chartsInserted++;
    }
  }

  // mover cursor solo si hay charts
  if (chartsInserted > 0) {
    currentRow += layout.CHART_HEIGHT_ROWS;
  }

  currentRow += layout.SPACING;

  // ====================================
  // PREPARAR ESPACIO HASTA TABLA
  // ====================================

  while (ws.rowCount < currentRow) {
    ws.addRow([]);
  }

  // ====================================
  // TABLA
  // ====================================

  const headers = [
    "Correlativo","Proveedor","Fecha solicitud","Fecha factura",
    "Factura","Tipo pago","Banco","Cuenta",
    "Total","Pagado","Saldo","Estado"
  ];

  ws.addRow(headers);

  const headerRowNumber = ws.lastRow.number;

  ws.lastRow.eachCell(c => {
    c.fill = styles.tableHeader;
    c.font = styles.whiteBold;
    c.alignment = { horizontal: "center" };
  });

  data.detalle?.forEach(d => {

    const row = ws.addRow([
      d.correlativo,
      d.proveedor,
      formatDDMMYY(d.fecha_solicitud),
      formatDDMMYY(d.fecha_factura),
      d.numero_factura || "-",
      d.tipo_pago,
      d.banco,
      d.numero_cuenta,
      Number(d.total_solicitud || 0),
      Number(d.total_pagado || 0),
      Number(d.saldo || 0),
      d.estado
    ]);

    row.getCell(9).numFmt = styles.moneyFmt;
    row.getCell(10).numFmt = styles.moneyFmt;
    row.getCell(11).numFmt = styles.moneyFmt;
  });

  // ====================================
  // AUTOFILTER + FREEZE DINÁMICO
  // ====================================

  ws.autoFilter = {
    from: `A${headerRowNumber}`,
    to: `L${headerRowNumber}`
  };

  ws.views = [{
    state: "frozen",
    ySplit: headerRowNumber
  }];

  // ====================================
  // COLUMN WIDTH
  // ====================================

  ws.columns.forEach(c => c.width = 20);

  return wb;
};