const { z } = require("zod");
const emptyToUndefined = (v) => (v === "" ? undefined : v);


const createProveedorSchema = z.object({
  nombre: z.string().min(3, "El nombre es obligatorio"),
  ruc: z.preprocess(emptyToUndefined,z.string().optional()),
  contacto: z.string().optional().nullable(),
  correo: z.preprocess(emptyToUndefined,z.string().email("Correo inválido").optional()),
  direccion: z.string().optional().nullable(),
  categoria_id: z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return null;
      return Number(v);
    },
    z.number().int().nullable()
  ).optional(),
});

const updateProveedorSchema = z.object({
  nombre: z.string().min(3).optional(),
  ruc: z.preprocess(emptyToUndefined,z.string().optional()),
  contacto: z.string().optional().nullable(),
  correo: z.preprocess(emptyToUndefined,z.string().email("Correo inválido").optional()),
  direccion: z.string().optional().nullable(),
  categoria_id: z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return null;
      return Number(v);
    },
    z.number().int().nullable()
  ).optional(),
});

module.exports = {
  createProveedorSchema,
  updateProveedorSchema
};
