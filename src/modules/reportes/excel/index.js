const ExcelJS = require("exceljs");
const styles = require("./styles");
const { formatDDMMYY } = require("./utils");

module.exports = async function buildExcel(data, res) {

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=reporte_solicitudes.xlsx"
  );

  const wb = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
    useSharedStrings: true
  });

  const ws = wb.addWorksheet("Reporte");

  // =========================
  // COLUMNAS (AHORA 13)
  // =========================
  ws.columns = [
    { width: 18 },
    { width: 32 },
    { width: 16 },
    { width: 16 },
    { width: 16 }, // 👈 fecha pago
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
  ws.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells("A2:M2");
  ws.getCell("A2").value = "Reporte de Solicitudes";
  ws.getCell("A2").alignment = { horizontal: "center" };
  ws.getCell("A2").font = { size: 13, bold: true };

  ws.mergeCells("A3:M3");
  ws.getCell("A3").value =
    `Periodo: ${formatDDMMYY(data.desde)} - ${formatDDMMYY(data.hasta)}`;

  ws.mergeCells("A4:M4");
  ws.getCell("A4").value =
    `Generado: ${formatDDMMYY(new Date())}`;

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

  // =========================
  // LABELS INFORMATIVOS
  // =========================
  let currentRow = 6;

  const addInfoRow = (text, color) => {
    const row = ws.addRow([text]);
    ws.mergeCells(`A${row.number}:M${row.number}`);

    const cell = ws.getCell(`A${row.number}`);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: color }
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: "left" };

    row.commit();
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

  ws.addRow([]).commit();

  // =========================
  // KPIs
  // =========================
  const saldoInicial = Number(data.saldo_inicial || 0);
  const comprasPeriodo = Number(data.kpis?.total_solicitado || 0);
  const pagosPeriodo = Number(data.kpis?.total_pagado || 0);
  const saldoFinal = Number(data.kpis?.saldo_pendiente || 0);

  const kpis = [
    ["Saldo inicial", saldoInicial, "FDE68A"],
    ["Compras del periodo", comprasPeriodo, "93C5FD"],
    ["Pagos del periodo", pagosPeriodo, "86EFAC"],
    ["Saldo final", saldoFinal, "FCA5A5"]
  ];

  let col = 1;

  kpis.forEach(k => {
    ws.mergeCells(currentRow, col, currentRow + 1, col + 2);

    const cell = ws.getCell(currentRow, col);

    cell.value = `${k[0]}\nL. ${Number(k[1]).toLocaleString()}`;

    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.font = { bold: true };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: k[2] }
    };

    col += 3;
  });

  ws.addRow([]).commit();
  ws.addRow([]).commit();

  // =========================
  // HEADERS TABLA
  // =========================
  const headers = [
    "Correlativo","Proveedor","Fecha solicitud","Fecha factura",
    "Fecha pago","Factura","Tipo pago","Banco","Cuenta",
    "Total","Pagado","Saldo","Estado"
  ];

  const headerRow = ws.addRow(headers);

  headerRow.eachCell(c => {
    c.fill = styles.tableHeader;
    c.font = styles.whiteBold;
    c.alignment = { horizontal: "center" };
  });

  const headerRowNumber = headerRow.number;
  headerRow.commit();

  // =========================
  // FILAS
  // =========================
  for await (const d of data.rowStream) {

    const row = ws.addRow([
      d.correlativo,
      d.proveedor,
      formatDDMMYY(d.fecha_solicitud),
      formatDDMMYY(d.fecha_factura),
      formatDDMMYY(d.fecha_pago), // 👈 NUEVO
      d.numero_factura || "-",
      d.tipo_pago,
      d.banco,
      d.numero_cuenta,
      Number(d.total_solicitud || 0),
      Number(d.total_pagado || 0),
      Number(d.saldo || 0),
      d.estado
    ]);

    row.getCell(10).numFmt = styles.moneyFmt;
    row.getCell(11).numFmt = styles.moneyFmt;
    row.getCell(12).numFmt = styles.moneyFmt;

    row.commit();
  }

  // =========================
  // FILTROS
  // =========================
  ws.autoFilter = {
    from: `A${headerRowNumber}`,
    to: `M${headerRowNumber}`
  };

  ws.views = [{
    state: "frozen",
    ySplit: headerRowNumber
  }];

  ws.commit();
  await wb.commit();
};