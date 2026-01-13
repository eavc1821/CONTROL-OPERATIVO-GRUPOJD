const pagosRepo = require("./pagos.repository");
const assertCtx = require("../../utils/assertPagoCtx");
const storage = require("../../core/storage");
const pool = require("../../core/db");
const bitacora = require("../bitacora/service");

async function list(ctx, filters = {}) {
  assertCtx(ctx);
  return pagosRepo.list({
    empresa_id: ctx.empresaId,
    solicitud_id: filters.solicitud_id
  });
}

async function getById(ctx, id) {
  assertCtx(ctx);
  return pagosRepo.getById(id, ctx.empresaId);
}

async function getFactura(ctx, pagoId) {
  assertCtx(ctx);

  const { rows } = await pool.query(
    `
    SELECT factura_url
    FROM pagos
    WHERE id = $1
      AND empresa_id = $2
    `,
    [pagoId, ctx.empresaId]
  );

  if (!rows[0]?.factura_url) return null;

  return rows[0].factura_url;
}


async function updateFactura(ctx, pagoId, file) {
  assertCtx(ctx);

  if (!file) {
    throw new Error("Debe adjuntar el PDF de la factura");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const pago = await pagosRepo.getById(pagoId, ctx.empresaId);
    if (!pago) {
      throw new Error("Pago no encontrado");
    }

    // 🔥 subir nuevo PDF a S3
    const saved = await storage.saveFileS3({
      tempPath: file.path,
      originalName: file.originalname,
      entidad: "pago",
      entidadId: pago.id,
      correlativo: pago.solicitud_id,
      empresaId: ctx.empresaId,
      empresaNombre: ctx.empresaNombre
    });

    // 🔥 actualizar referencia en pagos
    await client.query(
      `
      UPDATE pagos
      SET factura_url = $1,
          updated_at = NOW()
      WHERE id = $2
        AND empresa_id = $3
      `,
      [saved.url, pago.id, ctx.empresaId]
    );

    await client.query("COMMIT");

    await bitacora.registrar(
      { usuario_id: ctx.usuarioId, empresa_id: ctx.empresaId },
      {
        modulo: "pagos",
        accion: "REEMPLAZAR_FACTURA",
        descripcion: `Reemplazó factura del pago ${pago.id}`,
        data_nueva: { factura_url: saved.url }
      }
    );

    return { url: saved.url };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  list,
  getById,
  getFactura,
  updateFactura
};
