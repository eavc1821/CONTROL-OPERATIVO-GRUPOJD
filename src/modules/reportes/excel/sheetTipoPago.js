const styles = require("./styles");

module.exports = function sheetTipoPago(wb, paymentTypes) {

  const ws = wb.addWorksheet("Tipo Pago");

  ws.addRow(["Tipo", "Solicitado", "Pagado"]);

  paymentTypes.forEach(t => {
    const row = ws.addRow([
      t.tipo_pago,
      Number(t.total_solicitado || 0),
      Number(t.total_pagado || 0)
    ]);

    row.getCell(2).numFmt = styles.moneyFmt;
    row.getCell(3).numFmt = styles.moneyFmt;
  });

  ws.autoFilter = "A1:C1";

  ws.columns.forEach(c => c.width = 22);
};