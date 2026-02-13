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

  /* ==========================
     INYECTAR CSS
  ========================== */
  html = html.replaceAll("{{STYLES}}", `<style>${css}</style>`);

  /* ==========================
     HEADER / METADATA
  ========================== */
  html = html.replaceAll("{{EMPRESA}}", data.empresa?.nombre || "-");
  html = html.replaceAll("{{PERIODO}}", data.metadata?.periodo || "General");
  html = html.replaceAll(
    "{{GENERADO_EN}}",
    data.metadata?.generadoEn
      ? new Date(data.metadata.generadoEn).toLocaleString("es-HN")
      : "-"
  );

  /* ==========================
     RESUMEN
  ========================== */
  html = html.replaceAll(
    "{{TOTAL_SOLICITADO}}",
    data.resumen?.totalSolicitado || "L. 0"
  );
  html = html.replaceAll(
    "{{TOTAL_PAGADO}}",
    data.resumen?.totalPagado || "L. 0"
  );
  html = html.replaceAll(
    "{{SALDO_PENDIENTE}}",
    data.resumen?.saldoPendiente || "L. 0"
  );
  html = html.replaceAll(
    "{{TOTAL_REGISTROS}}",
    String(data.resumen?.totalRegistros ?? 0)
  );

  /* ==========================
     TABLA DETALLE
  ========================== */

  // Si no hay datos, mostrar mensaje explícito
  if (!Array.isArray(data.detalle) || data.detalle.length === 0) {
    html = html.replaceAll(
      "{{ROWS}}",
      `
        <tr>
          <td colspan="12" style="text-align:center; padding:12px;">
            No hay solicitudes para los filtros seleccionados
          </td>
        </tr>
      `
    );
    return html;
  }

  // Renderizar filas (12 columnas, alineadas con el header)
  const rowsHtml = data.detalle
    .map(
      r => `
        <tr>
          <td>${r.correlativo ?? "-"}</td>
          <td>${r.proveedor ?? "-"}</td>
          <td>${r.fecha_solicitud ?? "-"}</td>
          <td>${r.fecha_factura ?? "-"}</td>
          <td>${r.numero_factura ?? "-"}</td>
          <td>${r.tipo_pago ?? "-"}</td>
          <td>${r.banco ?? "-"}</td>
          <td>${r.cuenta ?? "-"}</td>
          <td>${r.total ?? "L. 0"}</td>
          <td>${r.pagado ?? "L. 0"}</td>
          <td>${r.saldo ?? "L. 0"}</td>
          <td>${r.estado ?? "-"}</td>
        </tr>
      `
    )
    .join("");

  html = html.replaceAll("{{ROWS}}", rowsHtml);

  return html;
};
