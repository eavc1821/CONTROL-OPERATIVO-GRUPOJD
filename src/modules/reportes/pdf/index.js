const renderPdf = require("./renderPdf");
const buildData = require("./data/buildReporteSolicitudesData");
const renderTemplate = require("./renderTemplate");

module.exports = async function generarReporteSolicitudesPDF(params) {
  const data = await buildData(params);

  console.log("📊 DATA PDF:", {
    resumen: data.resumen,
    detalleCount: data.detalle?.length,
    firstRow: data.detalle?.[0]
  });

  const html = renderTemplate(data);
  return renderPdf(html);
};
