const ExcelJS = require("exceljs");
const styles = require("./styles");
const { formatDDMMYY } = require("./utils");

module.exports = async function buildExcel(data, res) {

  // =========================
  // WORKBOOK NORMAL
  // =========================
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Reporte");

  // =========================
  // COLUMNAS (13)
  // =========================
  ws.columns = [
    { width: 18 },
    { width: 32 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 15 },
    { width: 18 },
    { width: 20 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 14 }
  ];

  // =========================
  // HEADER
  // =========================
  ws.mergeCells("A1:M1");
  ws.getCell("A1").value = data.empresaNombre || "Empresa";
  ws.getCell("A1").font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  ws.getCell("A1").fill = styles.headerBlue;
  ws.getCell("A1").alignment = { horizontal: "center" };

  ws.mergeCells("A2:M2");
  ws.getCell("A2").value = "Reporte de Solicitudes";
  ws.getCell("A2").alignment = { horizontal: "center" };
  ws.getCell("A2").font = { bold: true };

  ws.mergeCells("A3:M3");
  ws.getCell("A3").value =
    `Periodo: ${formatDDMMYY(data.desde)} - ${formatDDMMYY(data.hasta)}`;
  ws.getCell("A3").alignment = { horizontal: "center" };

  ws.mergeCells("A4:M4");
  ws.getCell("A4").value =
    `Generado: ${formatDDMMYY(new Date())}`;
  ws.getCell("A4").alignment = { horizontal: "center" };

  // =========================
  // FILTROS
  // =========================
  const filtrosTexto = [];

  if (data.filtros?.estado && data.filtros.estado !== "Todos") {
    filtrosTexto.push(`Estado: ${data.filtros.estado}`);
  }

  if (data.filtros?.proveedor && data.filtros.proveedor !== "Todos") {
    filtrosTexto.push(`Proveedor: ${data.filtros.proveedor}`);
  }

  ws.mergeCells("A5:M5");
  ws.getCell("A5").value =
    filtrosTexto.length
      ? `Filtros → ${filtrosTexto.join(" | ")}`
      : "Filtros → Todos";

  ws.getCell("A5").alignment = { horizontal: "center" };

  // =========================
  // LABELS INFORMATIVOS
  // =========================
  let currentRow = 6;

  const addInfoRow = (text, color) => {
    ws.mergeCells(`A${currentRow}:M${currentRow}`);
    const cell = ws.getCell(`A${currentRow}`);

    cell.value = text;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: color }
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: "left" };

    currentRow++;
  };

  if (Number(data.saldo_inicial_historico || 0) > 0) {
    addInfoRow(
      `📊 Saldo inicial del periodo: L. ${Number(data.saldo_inicial_historico).toLocaleString()}`,
      "F1F5F9"
    );
  }

  if (Number(data.pagos_mes_anterior || 0) > 0) {
    addInfoRow(
      `ℹ️ Pagos de meses anteriores: L. ${Number(data.pagos_mes_anterior).toLocaleString()}`,
      "DBEAFE"
    );
  }

  if (Number(data.cierre_mes || 0) > 0) {
    addInfoRow(
      `📊 Cierre del mes: L. ${Number(data.cierre_mes).toLocaleString()}`,
      "EDE9FE"
    );
  }

  currentRow++;

  // =========================
  // KPIs (CON MERGE REAL)
  // =========================
  const kpis = [
    ["Saldo inicial", data.saldo_inicial, "FDE68A"],
    ["Compras del periodo", data.kpis?.total_solicitado, "93C5FD"],
    ["Pagos del periodo", data.kpis?.total_pagado, "86EFAC"],
    ["Saldo final", data.kpis?.saldo_pendiente, "FCA5A5"]
  ];

  let col = 1;

  kpis.forEach(k => {
    ws.mergeCells(currentRow, col, currentRow + 1, col + 2);

    const cell = ws.getCell(currentRow, col);

    cell.value = `${k[0]}\nL. ${Number(k[1] || 0).toLocaleString()}`;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.font = { bold: true };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: k[2] }
    };

    col += 3;
  });

  currentRow += 3;

  // =========================
  // HEADERS TABLA
  // =========================
  const headers = [
    "Correlativo","Proveedor","Fecha solicitud","Fecha factura",
    "Fecha pago","Factura","Tipo pago","Banco","Cuenta",
    "Total","Pagado","Saldo","Estado"
  ];

  const headerRow = ws.getRow(currentRow);
  headerRow.values = headers;

  headerRow.eachCell(c => {
    c.fill = styles.tableHeader;
    c.font = styles.whiteBold;
    c.alignment = { horizontal: "center" };
  });

  currentRow++;

  // =========================
  // FILAS
  // =========================
  for await (const d of data.rowStream) {

    const row = ws.getRow(currentRow);

    row.values = [
      d.correlativo,
      d.proveedor,
      formatDDMMYY(d.fecha_solicitud || null),
      formatDDMMYY(d.fecha_factura || null),
      formatDDMMYY(d.fecha_pago || null),
      d.numero_factura || "-",
      d.tipo_pago,
      d.banco,
      d.numero_cuenta,
      Number(d.total_solicitud || 0),
      Number(d.total_pagado || 0),
      Number(d.saldo || 0),
      d.estado
    ];

    row.getCell(10).numFmt = styles.moneyFmt;
    row.getCell(11).numFmt = styles.moneyFmt;
    row.getCell(12).numFmt = styles.moneyFmt;

    currentRow++;
  }

  // =========================
  // FILTROS
  // =========================
  ws.autoFilter = {
    from: `A${currentRow - 1}`,
    to: `M${currentRow - 1}`
  };

  ws.views = [{
    state: "frozen",
    ySplit: currentRow - 1
  }];

  // =========================
  // RESPONSE
  // =========================
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=reporte_solicitudes.xlsx"
  );

  await wb.xlsx.write(res);
  res.end();
};