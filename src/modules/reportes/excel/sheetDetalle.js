const styles = require("./styles");

module.exports = function sheetDetalle(wb, detalle) {

  const ws = wb.addWorksheet("Detalle");

  ws.views = [{ state: "frozen", ySplit: 1 }];

  ws.addRow([
    "Correlativo","Proveedor","Fecha",
    "Factura","Tipo pago","Banco",
    "Total","Pagado","Saldo","Estado"
  ]);

  ws.getRow(1).eachCell(c => {
    c.fill = styles.tableHeader;
    c.font = styles.whiteBold;
  });

  detalle.forEach(d => {

    const row = ws.addRow([
      d.correlativo,
      d.proveedor,
      d.fecha_solicitud,
      d.numero_factura,
      d.tipo_pago,
      d.banco,
      Number(d.total_solicitud),
      Number(d.total_pagado),
      Number(d.saldo),
      d.estado
    ]);

    row.getCell(7).numFmt = styles.moneyFmt;
    row.getCell(8).numFmt = styles.moneyFmt;
    row.getCell(9).numFmt = styles.moneyFmt;
  });

  ws.autoFilter = "A1:J1";

  ws.columns.forEach(c => c.width = 20);
};