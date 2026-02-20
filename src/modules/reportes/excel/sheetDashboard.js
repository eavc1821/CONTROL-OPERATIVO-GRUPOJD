const styles = require("./styles");
const { formatDDMMYY } = require("./utils");

module.exports = function sheetDashboard(wb, data) {

  const ws = wb.addWorksheet("Dashboard");

  ws.mergeCells("A1:D1");
  ws.getCell("A1").value = data.empresaNombre;
  ws.getCell("A1").font = { size: 18, bold: true };
  ws.getCell("A1").alignment = { horizontal: "center" };
  ws.getCell("A1").fill = styles.headerBlue;

  ws.mergeCells("A2:D2");
  ws.getCell("A2").value = `Resumen General (${formatDDMMYY(data.desde)} - ${formatDDMMYY(data.hasta)})`;

  ws.addRow([]);
  ws.addRow(["KPI", "Valor"]);

  const kpis = [
    ["Total solicitado", data.kpis.total_solicitado],
    ["Total pagado", data.kpis.total_pagado],
    ["Saldo pendiente", data.kpis.saldo_pendiente],
    ["Solicitudes", data.kpis.total_solicitudes]
  ];

  kpis.forEach(k => {
    const row = ws.addRow(k);
    if (typeof k[1] === "number") {
      row.getCell(2).numFmt = styles.moneyFmt;
    }
  });

  ws.columns.forEach(c => c.width = 28);
};