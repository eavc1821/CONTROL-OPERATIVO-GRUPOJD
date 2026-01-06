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

  const pago = await pagosRepo.getById(pagoId, ctx.empresaId);
  if (!pago) return null;

  const { rows } = await pool.query(
    `
    SELECT url, nombre_original
    FROM archivos
    WHERE entidad = 'pago'
      AND entidad_id = $1
      AND empresa_id = $2
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [pagoId, ctx.empresaId]
  );

  return rows[0] || null;
}

async function updateFactura(ctx, pagoId, file) {
  assertCtx(ctx);

  if (!ctx.usuarioId) {
    throw new Error("usuarioId obligatorio para reemplazar factura");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const pago = await pagosRepo.getById(pagoId, ctx.empresaId);
    if (!pago) throw new Error("Pago no encontrado");
    if (!file) throw new Error("Debe adjuntar el PDF de la factura");

    await client.query(
      `
      UPDATE archivos
      SET estado = 'reemplazada'
      WHERE entidad = 'pago'
        AND entidad_id = $1
        AND empresa_id = $2
        AND estado = 'vigente'
      `,
      [pagoId, ctx.empresaId]
    );

    const saved = await storage.saveFileLocal({
      tempPath: file.path,
      originalName: file.originalname,
      entidad: "pago",
      entidadId: pagoId,
      correlativo: pago.solicitud_id
    });

    await client.query(
      `
      INSERT INTO archivos
        (entidad, entidad_id, nombre_original, path, url, mimetype, correlativo, estado, empresa_id, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'vigente',$8,NOW())
      `,
      [
        "pago",
        pagoId,
        file.originalname,
        saved.path,
        saved.url,
        file.mimetype,
        pago.solicitud_id,
        ctx.empresaId
      ]
    );

    await client.query(
      `UPDATE pagos SET tiene_factura = true WHERE id = $1`,
      [pagoId]
    );

    await client.query("COMMIT");

    await bitacora.registrar(
      { usuario_id: ctx.usuarioId, empresa_id: ctx.empresaId },
      {
        modulo: "pagos",
        accion: "REEMPLAZAR_FACTURA",
        descripcion: `Reemplazó factura del pago ${pagoId}`,
        data_nueva: { factura_url: saved.url }
      }
    );

    return { factura_url: saved.url };

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
