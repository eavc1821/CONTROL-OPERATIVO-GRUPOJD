const service = require("./service");

async function create(req, res, next) {
  try {
    const ctx = {
      empresaId: req.empresa_id,
      usuarioId: req.usuario?.id,
    };

    const ingreso = await service.create(ctx, req.body);

    res.status(201).json({
      ok: true,
      data: ingreso,
    });
  } catch (err) {
    next(err);
  }
}


async function list(req, res, next) {
  try {
    const ctx = {
      empresaId: req.empresa_id,
    };

    const result = await service.list(ctx, req.query);

    res.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list
};