const styles = require("./styles");

module.exports = function sheetProviders(wb, providers) {

  const ws = wb.addWorksheet("Top Proveedores");

  ws.addRow(["Proveedor", "Total Compras"]);

  ws.getRow(1).eachCell(c => {
    c.fill = styles.tableHeader;
    c.font = styles.whiteBold;
  });

  providers.forEach(p => {
    const row = ws.addRow([
      p.proveedor,
      Number(p.total_compras || 0)
    ]);
    row.getCell(2).numFmt = styles.moneyFmt;
  });

  ws.autoFilter = "A1:B1";

  ws.columns[0].width = 40;
  ws.columns[1].width = 20;
};