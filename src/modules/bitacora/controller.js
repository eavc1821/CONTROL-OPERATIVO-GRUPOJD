const service = require("./service");

exports.list = async (req, res, next) => {
  try {
    const { modulo, accion, empresa_id: empresaFiltro } = req.query;

    const data = await service.list({
      modulo,
      accion,
      empresa_id: empresaFiltro || null
    });

    res.json({
      ok: true,
      data,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) {
    next(err);
  }
};
