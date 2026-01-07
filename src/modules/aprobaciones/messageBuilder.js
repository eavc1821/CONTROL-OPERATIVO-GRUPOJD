// src/modules/aprobaciones/messageBuilder.js

function formatCurrency(value) {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    minimumFractionDigits: 2
  }).format(value);
}

function normalizeTipoPago(tipo) {
  switch (tipo) {
    case "contado": return "Contado";
    case "credito": return "Crédito";
    case "reembolso": return "Reembolso";
    default: return tipo;
  }
}

function buildLinks(baseUrl, token) {
  const t = encodeURIComponent(token);

  return {
    approve: `${baseUrl}/api/v1/aprobaciones/resolve?accion=aprobar&token=${t}`,
    reject: `${baseUrl}/api/v1/aprobaciones/resolve?accion=rechazar&token=${t}`,
    view: `${baseUrl}/solicitudes/ver?token=${t}`
  };
}

function buildWhatsAppApprovalMessage({ solicitud, token, baseUrl }) {
  if (!solicitud || !token || !baseUrl) {
    throw new Error("Faltan datos para construir el mensaje de aprobación");
  }

  const links = buildLinks(baseUrl, token);

  const descripcion = solicitud.descripcion
    ? solicitud.descripcion.slice(0, 180)
    : "Sin descripción";

  const message = `
📄 *Solicitud de aprobación*

🔢 *Solicitud:* ${solicitud.correlativo}
🏢 *Proveedor:* ${solicitud.proveedor_nombre}
💰 *Monto:* ${formatCurrency(solicitud.total)}
💳 *Tipo de pago:* ${normalizeTipoPago(solicitud.tipo_pago)}
📝 *Detalle:* ${descripcion}

👉 *Acción requerida*
✅ Aprobar: ${links.approve}
❌ Rechazar: ${links.reject}

🔍 Ver detalle completo:
${links.view}

⏳ Con que una persona apruebe es suficiente.
`.trim();

  return {
    message,
    links
  };
}

module.exports = {
  buildWhatsAppApprovalMessage
};
