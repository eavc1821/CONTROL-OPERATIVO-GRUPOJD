module.exports = function buildFooter(currentPage, pageCount) {
  return {
    text: `Documento generado por el sistema · Página ${currentPage} de ${pageCount}`,
    style: "footer",
    alignment: "center",
    margin: [0, 10, 0, 0]
  };
};
