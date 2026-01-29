const { z } = require("zod");
const emptyToNull = (v) => (v === "" ? null : v);

const createProveedorSchema = z.object({
  nombre: z.string().min(3, "El nombre es obligatorio"),
  ruc: z.string().optional().nullable(),
  contacto: z.string().optional().nullable(),
  correo: z.string().email("Correo inválido").optional().nullable(),
  direccion: z.string().optional().nullable(),
  categoria_id: z.number().int().optional().nullable(),
  cai: z.string().min(5, "El CAI es obligatorio"),
  fecha_limite_emision: z.preprocess(emptyToNull,z.string().regex(/^\d{2}\/\d{2}\/\d{2}$/).nullable()).optional(),
  rango_factura_desde: z.preprocess(emptyToNull,z.string().regex(/^\d{3}-\d{3}-\d{2}-\d{8}$/).nullable()).optional(),
  rango_factura_hasta: z.preprocess(emptyToNull,z.string().regex(/^\d{3}-\d{3}-\d{2}-\d{8}$/).nullable()).optional(),
});

const updateProveedorSchema = z.object({
  nombre: z.string().min(3).optional(),
  ruc: z.string().optional().nullable(),
  contacto: z.string().optional().nullable(),
  correo: z.string().email("Correo inválido").optional().nullable(),
  direccion: z.string().optional().nullable(),
  categoria_id: z.number().int().optional().nullable(),
  cai: z.string().min(5).optional().nullable(),
  fecha_limite_emision: z.preprocess(emptyToNull,z.string().regex(/^\d{2}\/\d{2}\/\d{2}$/).nullable()).optional(),
  rango_factura_desde: z.preprocess(emptyToNull,z.string().regex(/^\d{3}-\d{3}-\d{2}-\d{8}$/).nullable()).optional(),
  rango_factura_hasta: z.preprocess(emptyToNull,z.string().regex(/^\d{3}-\d{3}-\d{2}-\d{8}$/).nullable()).optional(),
});

module.exports = {
  createProveedorSchema,
  updateProveedorSchema
};
