const { z } = require("zod");

const userRegisterSchema = z.object({
  nombre: z.string().min(3, "El nombre es obligatorio"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rol: z.enum(["admin", "viewer"]).default("viewer")
});

const userLoginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria")
});

module.exports = {
  userRegisterSchema,
  userLoginSchema
};
