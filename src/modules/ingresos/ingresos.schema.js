const { z } = require("zod");

const createIngresoSchema = z.object({
  fecha_hora_descarga: z.coerce.date(),
  cliente_id: z.coerce.number(),
  operador_id: z.coerce.number(),
  cisterna_id: z.coerce.number(),
  precio_viaje_aplicado: z.coerce
    .number()
    .positive("El valor del viaje debe ser mayor a 0"),
  viaticos: z.coerce.number().nonnegative().optional().default(3500),
});

module.exports = {
  createIngresoSchema,
};
