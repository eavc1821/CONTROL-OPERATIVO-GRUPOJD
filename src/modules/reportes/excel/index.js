const ExcelJS = require("exceljs");
const styles = require("./styles");
const { formatDDMMYY } = require("./utils");
const layout = require("./layout");

module.exports = async function buildExcel(data, res) {


    // ====================================
  // HEADERS HTTP (ANTES DEL STREAM)
  // ====================================
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=reporte_solicitudes.xlsx"
  );

  // ====================================
  // WORKBOOK STREAM
  // ====================================
  const wb = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
    useSharedStrings: true
  });

  const ws = wb.addWorksheet("Reporte");

  // ====================================
  // HEADER
  // ====================================

  ws.mergeCells("A1:L1");
  ws.getCell("A1").value = data.empresaNombre || "Empresa";
  ws.getCell("A1").font = {
    size: 18,
    bold: true,
    color: { argb: "FFFFFFFF" }
  };
  ws.getCell("A1").fill = styles.headerBlue;
  ws.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle"
  };

  ws.mergeCells("A2:L2");
  ws.getCell("A2").value = "Reporte de Solicitudes";
  ws.getCell("A2").alignment = { horizontal: "center" };
  ws.getCell("A2").font = { size: 13, bold: true };

  ws.mergeCells("A3:L3");
  ws.getCell("A3").value =
    `Periodo: ${formatDDMMYY(data.desde)} - ${formatDDMMYY(data.hasta)}`;
  ws.getCell("A3").alignment = { horizontal: "center" };

  ws.mergeCells("A4:L4");
  ws.getCell("A4").value =
    `Generado: ${formatDDMMYY(new Date())}`;
  ws.getCell("A4").alignment = { horizontal: "center" };

  const filtrosTexto = [];

  if (data.filtros?.estado && data.filtros.estado !== "Todos") {
    filtrosTexto.push(`Estado: ${data.filtros.estado}`);
  }

  if (data.filtros?.proveedor && data.filtros.proveedor !== "Todos") {
    filtrosTexto.push(`Proveedor: ${data.filtros.proveedor}`);
  }

  ws.mergeCells("A5:L5");
  ws.getCell("A5").value =
    filtrosTexto.length
      ? `Filtros → ${filtrosTexto.join(" | ")}`
      : "Filtros → Todos";

  ws.getCell("A5").alignment = { horizontal: "center" };

  let currentRow = 6;

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
      `${k[0]}\n${
        k[0] === "Solicitudes"
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

  while (ws.rowCount < currentRow) {
    ws.addRow([]).commit();
  }

  // ====================================
  // TABLA
  // ====================================

  const headers = [
    "Correlativo","Proveedor","Fecha solicitud","Fecha factura",
    "Factura","Tipo pago","Banco","Cuenta",
    "Total","Pagado","Saldo","Estado"
  ];

  const headerRow = ws.addRow(headers);
  headerRow.eachCell(c => {
    c.fill = styles.tableHeader;
    c.font = styles.whiteBold;
    c.alignment = { horizontal: "center" };
  });
  headerRow.commit();

  const headerRowNumber = ws.rowCount;

  for await (const d of data.rowStream) {

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

  row.commit();
}

  ws.autoFilter = {
    from: `A${headerRowNumber}`,
    to: `L${headerRowNumber}`
  };

  ws.views = [{
    state: "frozen",
    ySplit: headerRowNumber
  }];

  ws.columns.forEach(c => {
    c.width = 20;
  });

  ws.commit();
  await wb.commit();
};