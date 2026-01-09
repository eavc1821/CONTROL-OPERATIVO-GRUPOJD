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
  const link = `${baseUrl}/aprobaciones/preview?token=${encodeURIComponent(token)}`;

  const message = `
📄 *Solicitud de aprobación*

🔢 *Solicitud:* ${solicitud.correlativo}
🏢 *Proveedor:* ${solicitud.proveedor_nombre}
💰 *Monto:* ${formatCurrency(solicitud.total)}
💳 *Tipo de pago:* ${normalizeTipoPago(solicitud.tipo_pago)}
📝 *Detalle:* ${descripcion}

👉 *Revisar solicitud:*
${link}

⏳ Con que una persona apruebe o rechace es suficiente.
`.trim();

  return { message, link };
}

module.exports = {
  buildWhatsAppApprovalMessage
};
