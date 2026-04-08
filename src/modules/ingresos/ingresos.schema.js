const { z } = require("zod");

const createIngresoSchema = z.object({
  fecha_hora_descarga: z.coerce.date(),
  cliente_id: z.coerce.number(),
  operador_id: z.coerce.number(),
  cisterna_id: z.coerce.number(),
});

module.exports = {
  createIngresoSchema,
};