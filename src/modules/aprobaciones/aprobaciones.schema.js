// src/modules/aprobaciones/aprobaciones.schema.js
const { z } = require("zod");

const resolveAprobacionSchema = z.object({
  token: z.string().uuid("Token inválido"),
  accion: z.enum(["aprobar", "rechazar"]),
  comentario: z.string().optional().nullable()
});

module.exports = {
  resolveAprobacionSchema
};
