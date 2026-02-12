const renderPdf = require("./renderPdf");
const buildData = require("./data/buildReporteSolicitudesData");
const renderTemplate = require("./renderTemplate");

module.exports = async function generarReporteSolicitudesPDF(params) {
  const data = await buildData(params);
  const html = renderTemplate(data);
  return renderPdf(html);
};
