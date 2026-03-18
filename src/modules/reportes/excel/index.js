const ExcelJS = require("exceljs");
const styles = require("./styles");
const { formatDDMMYY } = require("./utils");

module.exports = async function buildExcel(data, res) {

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Reporte");

  // =========================
  // COLUMNAS (13)
  // =========================
  ws.columns = [
    { width: 18 }, { width: 32 },
    { width: 16 }, { width: 16 },
    { width: 16 }, { width: 16 },
    { width: 15 }, { width: 18 },
    { width: 20 }, { width: 15 },
    { width: 15 }, { width: 15 },
    { width: 14 }
  ];

  // =========================
  // HEADER PRINCIPAL
  // =========================
  ws.mergeCells("A1:M1");
  const header = ws.getCell("A1");
  header.value = data.empresaNombre || "Empresa";
  header.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = styles.headerBlue;
  header.alignment = { horizontal: "center" };

  ws.mergeCells("A2:M2");
  ws.getCell("A2").value = "Reporte de Solicitudes";
  ws.getCell("A2").font = { bold: true, size: 13 };
  ws.getCell("A2").alignment = { horizontal: "center" };

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
  const filtros = [];

  if (data.filtros?.estado && data.filtros.estado !== "Todos") {
    filtros.push(`Estado: ${data.filtros.estado}`);
  }

  if (data.filtros?.proveedor && data.filtros.proveedor !== "Todos") {
    filtros.push(`Proveedor: ${data.filtros.proveedor}`);
  }

  ws.mergeCells("A5:M5");
  ws.getCell("A5").value =
    filtros.length ? `Filtros → ${filtros.join(" | ")}` : "Filtros → Todos";
  ws.getCell("A5").alignment = { horizontal: "center" };

  // =========================
// LABELS INFORMATIVOS (HORIZONTALES)
// =========================

let rowIndex = 6;

const saldoInicialHist = Number(data.saldo_inicial_historico || 0);
const pagosMesAnterior = Number(data.pagos_mes_anterior || 0);
const cierreMes = Number(data.cierre_mes || 0);

const labels = [];

if (saldoInicialHist > 0) {
  labels.push(`Saldo inicial del periodo: L. ${saldoInicialHist.toLocaleString()}`);
}

if (pagosMesAnterior > 0) {
  labels.push(`Pagos de meses anteriores: L. ${pagosMesAnterior.toLocaleString()}`);
}

if (cierreMes > 0) {
  labels.push(`Cierre del mes: L. ${cierreMes.toLocaleString()}`);
}

if (labels.length > 0) {

  ws.mergeCells(`A${rowIndex}:M${rowIndex}`);

  const cell = ws.getCell(`A${rowIndex}`);

  cell.value = labels.join("   |   ");

  cell.font = {
    size: 11,
    bold: true,
    color: { argb: "334155" }
  };

  cell.alignment = {
    horizontal: "center",
    vertical: "middle"
  };

  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "F8FAFC" } // gris muy suave
  };

  cell.border = {
    bottom: { style: "thin", color: { argb: "CBD5E1" } }
  };

  rowIndex += 2; // espacio antes de KPIs
}

  // =========================
  // KPIs
  // =========================
  const kpis = [
    ["Saldo inicial", data.saldo_inicial, "FDE68A"],
    ["Compras", data.kpis?.total_solicitado, "93C5FD"],
    ["Pagos", data.kpis?.total_pagado, "86EFAC"],
    ["Saldo final", data.kpis?.saldo_pendiente, "FCA5A5"]
  ];

  let col = 1;

  kpis.forEach(k => {
    ws.mergeCells(rowIndex, col, rowIndex + 1, col + 2);

    const cell = ws.getCell(rowIndex, col);
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

  rowIndex += 3;

  // =========================
  // HEADERS TABLA
  // =========================
  const headers = [
    "Correlativo","Proveedor","Fecha solicitud","Fecha factura",
    "Fecha pago","Factura","Tipo pago","Banco","Cuenta",
    "Total","Pagado","Saldo","Estado"
  ];

  const headerRow = ws.getRow(rowIndex);
  headerRow.values = headers;

  headerRow.eachCell(c => {
    c.fill = styles.tableHeader;
    c.font = styles.whiteBold;
    c.alignment = { horizontal: "center" };

    c.border = {
      top: { style: "thin" },
      bottom: { style: "thin" }
    };
  });

  const headerRowNumber = rowIndex;
  rowIndex++;

  // =========================
  // FILAS (ZEBRA + BORDES)
  // =========================
  let zebra = false;

  for await (const d of data.rowStream) {

    const row = ws.getRow(rowIndex);

    row.values = [
      d.correlativo,
      d.proveedor,
      formatDDMMYY(d.fecha_solicitud),
      formatDDMMYY(d.fecha_factura),
      formatDDMMYY(d.fecha_pago),
      d.numero_factura || "-",
      d.tipo_pago,
      d.banco,
      d.numero_cuenta,
      Number(d.total_solicitud || 0),
      Number(d.total_pagado || 0),
      Number(d.saldo || 0),
      d.estado
    ];

    row.eachCell(c => {
      c.border = {
        bottom: { style: "hair" }
      };

      if (zebra) {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F8FAFC" }
        };
      }
    });

    row.getCell(10).numFmt = styles.moneyFmt;
    row.getCell(11).numFmt = styles.moneyFmt;
    row.getCell(12).numFmt = styles.moneyFmt;

    zebra = !zebra;
    rowIndex++;
  }

  // =========================
  // FILTROS + FREEZE
  // =========================
  ws.autoFilter = {
    from: `A${headerRowNumber}`,
    to: `M${headerRowNumber}`
  };

  ws.views = [{
    state: "frozen",
    ySplit: headerRowNumber
  }];

  // =========================
  // EXPORT
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