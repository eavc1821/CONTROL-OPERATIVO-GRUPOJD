const pool = require("../../core/db");
const repo = require("./repository");

async function create(ctx, payload) {
  if (ctx.empresaId !== 6) {
    throw new Error(
      "Este tipo de ingreso solo aplica para Transporte Especializado JD"
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const year = new Date().getFullYear();

    const correlativo = `ING-${year}-${String(Date.now()).slice(-6)}`;

    const ingreso = await repo.createIngresoTx(client, {
      empresa_id: ctx.empresaId,
      correlativo,
    });

    const numeroViaje = await repo.getNextNumeroViajeTx(
      client,
      ctx.empresaId,
      payload.cisterna_id
    );

    const detalle = await repo.createIngresoDetalleTx(client, {
      ingreso_id: ingreso.id,
      ...payload,
      numero_viaje: numeroViaje,
    });

    await client.query("COMMIT");

    return {
      ...ingreso,
      detalle,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}


async function list(ctx, query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);

  const result = await repo.getIngresosPaginated({
    empresaId: ctx.empresaId,
    page,
    limit,
    search: query.search || "",
  });

  return {
    data: result.data,
    meta: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  };
}

module.exports = {
  create,
  list
};