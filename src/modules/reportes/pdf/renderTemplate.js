const fs = require("fs");
const path = require("path");

module.exports = function renderTemplate(data) {
  const templatePath = path.join(
    __dirname,
    "templates",
    "reporteSolicitudes.html"
  );

  const cssPath = path.join(
    __dirname,
    "styles",
    "reporteSolicitudes.css"
  );

  let html = fs.readFileSync(templatePath, "utf8");
  const css = fs.readFileSync(cssPath, "utf8");

  // Inyectar CSS
  html = html.replace("{{STYLES}}", `<style>${css}</style>`);

  // Header
  html = html.replace("{{EMPRESA}}", data.empresa.nombre);
  html = html.replace("{{PERIODO}}", data.metadata.periodo);
  html = html.replace(
    "{{GENERADO_EN}}",
    new Date(data.metadata.generadoEn).toLocaleString("es-HN")
  );

  // Resumen
  html = html.replace("{{TOTAL_SOLICITADO}}", data.resumen.totalSolicitado);
  html = html.replace("{{TOTAL_PAGADO}}", data.resumen.totalPagado);
  html = html.replace("{{SALDO_PENDIENTE}}", data.resumen.saldoPendiente);
  html = html.replace("{{TOTAL_REGISTROS}}", data.resumen.totalRegistros);

  // Tabla
  const rowsHtml = data.detalle
    .map(
      r => `
      <tr>
        <td>${r.correlativo}</td>
        <td>${r.proveedor}</td>
        <td>${r.fecha_solicitud}</td>
        <td>${r.numero_factura}</td>
        <td>${r.total}</td>
        <td>${r.pagado}</td>
        <td>${r.saldo}</td>
        <td>${r.estado}</td>
      </tr>
    `
    )
    .join("");

  html = html.replace("{{ROWS}}", rowsHtml);

  return html;
};
