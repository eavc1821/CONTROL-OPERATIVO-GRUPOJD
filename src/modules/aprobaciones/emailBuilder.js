// src/modules/aprobaciones/emailBuilder.js

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

function buildApprovalEmail({ solicitud, token, baseUrl }) {
  if (!solicitud || !token || !baseUrl) {
    throw new Error("Faltan datos para construir el email de aprobación");
  }

  const link = `${baseUrl}/aprobaciones.html?token=${encodeURIComponent(token)}`;

  const subject = `Solicitud pendiente de aprobación – ${solicitud.correlativo}`;

  const text = `
Solicitud pendiente de aprobación

Solicitud: ${solicitud.correlativo}
Proveedor: ${solicitud.proveedor_nombre}
Monto: ${formatCurrency(solicitud.total)}
Tipo de pago: ${normalizeTipoPago(solicitud.tipo_pago)}

Para revisar el detalle completo y aprobar o rechazar la solicitud,
acceda al siguiente enlace:

${link}

Una vez que la solicitud sea resuelta, el enlace quedará deshabilitado.
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Solicitud pendiente de aprobación</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;padding:24px;">
          <tr>
            <td>
              <h2 style="margin:0 0 12px;font-size:18px;color:#111827;">
                Solicitud pendiente de aprobación
              </h2>

              <p style="margin:0 0 16px;font-size:14px;color:#374151;">
                Se ha generado una solicitud que requiere su revisión y decisión.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#111827;">
                <tr>
                  <td style="padding:4px 0;color:#6b7280;">Solicitud</td>
                  <td style="padding:4px 0;font-weight:600;" align="right">
                    ${solicitud.correlativo}
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#6b7280;">Proveedor</td>
                  <td style="padding:4px 0;font-weight:600;" align="right">
                    ${solicitud.proveedor_nombre}
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#6b7280;">Monto</td>
                  <td style="padding:4px 0;font-weight:600;" align="right">
                    ${formatCurrency(solicitud.total)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#6b7280;">Tipo de pago</td>
                  <td style="padding:4px 0;font-weight:600;" align="right">
                    ${normalizeTipoPago(solicitud.tipo_pago)}
                  </td>
                </tr>
              </table>

              <div style="margin:24px 0;text-align:center;">
                <a href="${link}"
                   style="display:inline-block;padding:12px 20px;
                          background:#2563eb;color:#ffffff;
                          text-decoration:none;border-radius:6px;
                          font-weight:600;font-size:14px;">
                  Revisar solicitud
                </a>
              </div>

              <p style="margin:0;font-size:12px;color:#6b7280;">
                Una vez que la solicitud sea resuelta, el enlace quedará deshabilitado.
              </p>

              <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">
                Este es un mensaje automático, por favor no responda a este correo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  return {
    subject,
    html,
    text
  };
}

module.exports = {
  buildApprovalEmail
};
