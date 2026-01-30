/**
 * CONTRATO OFICIAL – Reporte de Solicitudes (PDF)
 * Este contrato define EXACTAMENTE qué consume el HTML.
 * Cualquier cambio aquí implica cambiar template y/o SQL.
 */

module.exports = {
  detalle: {
    correlativo: "number|string",
    proveedor: "string",

    fecha_solicitud: "string (dd/mm/yyyy)",
    fecha_factura: "string (dd/mm/yyyy | '-')",

    numero_factura: "string",

    tipo_pago: "string",
    banco: "string",
    cuenta: "string",

    total: "string (moneda formateada)",
    pagado: "string (moneda formateada)",
    saldo: "string (moneda formateada)",

    estado: "string"
  }
};
