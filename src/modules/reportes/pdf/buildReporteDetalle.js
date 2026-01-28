const PdfPrinter = require("pdfmake");
const styles = require("./styles");
const buildHeader = require("./sections/header");
const buildKpis = require("./sections/kpis");
const buildTable = require("./sections/table");
const buildFooter = require("./sections/footer");

const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold"
  }
};

module.exports = function buildReporteDetalle({ empresaNombre, periodo, detalle }) {
  const docDefinition = {
    styles,
    footer: buildFooter,
    content: [
      buildHeader({ empresaNombre, periodo }),
      buildKpis(detalle),
      buildTable(detalle)
    ]
  };

  const printer = new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  return new Promise(resolve => {
    const chunks = [];
    pdfDoc.on("data", c => chunks.push(c));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.end();
  });
};
