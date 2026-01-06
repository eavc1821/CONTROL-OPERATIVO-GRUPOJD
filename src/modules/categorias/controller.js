const service = require("./service");

function onlySuperAdmin(req, res) {
  if (!req.usuario || req.usuario.rol !== "superadmin") {
    res.status(403).json({
      ok: false,
      message: "Solo superadmin puede realizar esta acción"
    });
    return false;
  }
  return true;
}

async function list(req, res, next) {
  try {
    const data = await service.list();
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
}

async function get(req, res, next) {
  try {
    const data = await service.get(req.params.id);
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
}

async function create(req, res, next) {
  if (!onlySuperAdmin(req, res)) return;

  try {
    const data = await service.create(req, req.body);
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
}

async function update(req, res, next) {
  if (!onlySuperAdmin(req, res)) return;

  try {
    const data = await service.update(req, req.params.id, req.body);
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
}

async function remove(req, res, next) {
  if (!onlySuperAdmin(req, res)) return;

  try {
    await service.remove(req, req.params.id);
    res.json({ 
      ok: true,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  get,
  create,
  update,
  remove
};
