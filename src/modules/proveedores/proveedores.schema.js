const { z } = require("zod");

const createProveedorSchema = z.object({
  nombre: z.string().min(3, "El nombre es obligatorio"),
  ruc: z.string().optional().nullable(),
  contacto: z.string().optional().nullable(),
  correo: z.string().email("Correo inválido").optional().nullable(),
  direccion: z.string().optional().nullable(),
  categoria_id: z.number().int().optional().nullable(),
  cai: z.string().min(5, "El CAI es obligatorio"),
});

const updateProveedorSchema = z.object({
  nombre: z.string().min(3).optional(),
  ruc: z.string().optional().nullable(),
  contacto: z.string().optional().nullable(),
  correo: z.string().email("Correo inválido").optional().nullable(),
  direccion: z.string().optional().nullable(),
  categoria_id: z.number().int().optional().nullable(),
  cai: z.string().min(5).optional().nullable(),
});

module.exports = {
  createProveedorSchema,
  updateProveedorSchema
};
