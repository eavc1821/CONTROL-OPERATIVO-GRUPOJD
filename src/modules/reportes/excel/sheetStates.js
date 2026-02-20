module.exports = function sheetStates(wb, states) {

  const ws = wb.addWorksheet("Estados");

  ws.addRow(["Estado", "Cantidad"]);

  states.forEach(s => {
    ws.addRow([s.estado, Number(s.cnt || 0)]);
  });

  ws.autoFilter = "A1:B1";
  ws.columns[0].width = 20;
  ws.columns[1].width = 15;
};