const PdfPrinter = require("pdfmake");
const pdfFonts = require("pdfmake/build/vfs_fonts");

const styles = require("./styles");
const buildHeader = require("./sections/header");
const buildKpis = require("./sections/kpis");
const buildTable = require("./sections/table");
const buildFooter = require("./sections/footer");

// 🔹 Cargar fuentes en memoria (OBLIGATORIO en Railway / Linux)
PdfPrinter.prototype.vfs = pdfFonts.pdfMake.vfs;

// 🔹 Definición de fuentes (NO depender del SO)
const fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf"
  }
};

module.exports = function buildReporteDetalle({
  empresaNombre,
  periodo,
  detalle
}) {
  // Blindaje mínimo (evita crashes silenciosos)
  const detalleSafe = Array.isArray(detalle) ? detalle : [];

  const docDefinition = {
    styles,

    // ⚠️ footer debe ser función inline para evitar errores silenciosos
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
