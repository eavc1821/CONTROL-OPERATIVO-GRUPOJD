const { z } = require("zod");

const createProveedorSchema = z.object({
  nombre: z.string().min(3, "El nombre es obligatorio"),
  ruc: z.string().optional().nullable(),
  contacto: z.string().optional().nullable(),
  correo: z.string().email("Correo inválido").optional().nullable(),
  direccion: z.string().optional().nullable(),
  categoria_id: z.number().int().optional().nullable(),
  cai: z.string().min(5, "El CAI es obligatorio"),
  fecha_limite_emision: z.string().regex(/^\d{2}\/\d{2}\/\d{2}$/, "Formato inválido (dd/mm/yy)").optional().nullable(),
  rango_factura_desde: z.number().int().positive().optional().nullable(),
  rango_factura_hasta: z.number().int().positive().optional().nullable(),
});

const updateProveedorSchema = z.object({
  nombre: z.string().min(3).optional(),
  ruc: z.string().optional().nullable(),
  contacto: z.string().optional().nullable(),
  correo: z.string().email("Correo inválido").optional().nullable(),
  direccion: z.string().optional().nullable(),
  categoria_id: z.number().int().optional().nullable(),
  cai: z.string().min(5).optional().nullable(),
  fecha_limite_emision: z.string().regex(/^\d{2}\/\d{2}\/\d{2}$/).optional().nullable(),
  rango_factura_desde: z.number().int().positive().optional().nullable(),
  rango_factura_hasta: z.number().int().positive().optional().nullable(),
});

module.exports = {
  createProveedorSchema,
  updateProveedorSchema
};
