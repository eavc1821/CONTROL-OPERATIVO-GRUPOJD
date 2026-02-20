const ExcelJS = require("exceljs");

const dashboard = require("./sheetDashboard");
const providers = require("./sheetProviders");
const states = require("./sheetStates");
const tipoPago = require("./sheetTipoPago");
const detalle = require("./sheetDetalle");

module.exports = async function buildExcel(data) {

  const wb = new ExcelJS.Workbook();

  dashboard(wb, data);
  providers(wb, data.providers);
  states(wb, data.states);
  tipoPago(wb, data.paymentTypes);
  detalle(wb, data.detalle);

  return wb;
};