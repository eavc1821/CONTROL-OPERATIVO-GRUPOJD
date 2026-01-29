const renderPdf = require("./renderPdf");
const buildData = require("./data/buildReporteSolicitudesData");

module.exports = async function generarReporteSolicitudesPDF(params) {
  const data = await buildData(params);
  return renderPdf(data);
};
