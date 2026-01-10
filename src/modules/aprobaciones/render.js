const fs = require("fs");
const path = require("path");

module.exports = function renderAprobacionHTML(data) {
  const template = fs.readFileSync(
    path.join(__dirname, "../../public/aprobaciones.html"),
    "utf8"
  );

  return template
    .replace("{{correlativo}}", data.correlativo)
    .replace("{{empresa}}", data.empresa)
    .replace("{{proveedor}}", data.proveedor)
    .replace("{{total}}", data.total)
    .replace("{{descripcion}}", data.descripcion);
};
