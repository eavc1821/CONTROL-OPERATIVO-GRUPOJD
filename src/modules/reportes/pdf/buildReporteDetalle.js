const path = require("path");
const PdfPrinter = require("pdfmake");

const styles = require("./styles");
const buildHeader = require("./sections/header");
const buildKpis = require("./sections/kpis");
const buildTable = require("./sections/table");
const buildFooter = require("./sections/footer");

// 🔹 Fuentes Roboto incluidas por pdfmake (server-side)
const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../../../node_modules/pdfmake/fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "../../../node_modules/pdfmake/fonts/Roboto-Medium.ttf")
  }
};

module.exports = function buildReporteDetalle({
  empresaNombre,
  periodo,
  detalle
}) {
  const detalleSafe = Array.isArray(detalle) ? detalle : [];

  const docDefinition = {
    styles,

    footer: (currentPage, pageCount) =>
      buildFooter(currentPage, pageCount),

    content: [
      buildHeader({ empresaNombre, periodo }),
      buildKpis(detalleSafe),
      buildTable(detalleSafe)
    ]
  };

  const printer = new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  return new Promise((resolve, reject) => {
    try {
      const chunks = [];

      pdfDoc.on("data", chunk => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", err => reject(err));

      pdfDoc.end();
    } catch (err) {
      reject(err);
    }
  });
};
