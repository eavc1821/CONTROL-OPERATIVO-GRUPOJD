// src/modules/solicitudes/solicitudes.schema.js
const { z } = require("zod");

const createSolicitudSchema = z.object({
  proveedor_id: z.coerce.number(),
  categoria_id: z.coerce.number(),        // ⭐ nuevo
  tipo_pago: z.enum(["contado", "credito", "reembolso"]).default("contado"),
  notas: z.string().optional().nullable(),
  total: z.coerce.number(),

  fecha_solicitud: z.coerce.date().optional(),
  descripcion: z.string().optional().nullable(),
});

const approveSolicitudSchema = z.object({
  comentario: z.string().optional(),
  numero_factura: z.string().min(1, "El número de factura es requerido"),
  fecha_factura: z
  .string()
  .min(1, "La fecha de factura es requerida"),
});

const rejectSolicitudSchema = z.object({
  comentario: z.string().min(1, "Debe ingresar un comentario"),
});

const registrarPagoSchema = z.object({
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  fecha_pago: z.coerce.date().optional(),
  metodo_pago: z.string().min(1, "El método de pago es requerido").optional(),
  referencia: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

module.exports = {
  createSolicitudSchema,
  approveSolicitudSchema,
  rejectSolicitudSchema,
  registrarPagoSchema
};
