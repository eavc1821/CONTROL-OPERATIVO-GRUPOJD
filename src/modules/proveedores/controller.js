const service = require("./service");

function onlyAdmin(req, res) {
  if (!req.usuario || !["admin", "superadmin"].includes(req.usuario.rol)) {
    res.status(403).json({
      ok: false,
      message: "No tiene permisos para realizar esta acción"
    });
    return false;
  }
  return true;
}

// Listar proveedores globales (superadmin)
async function list(req, res, next) {
  try {
    const data = await service.listGlobal();
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

// Listar proveedores por empresa
async function listByEmpresa(req, res, next) {
  try {
    const data = await service.listByEmpresa(req.empresa_id);
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

// Obtener proveedor
async function get(req, res, next) {
  try {
    const data = await service.get(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Proveedor no encontrado"
      });
    }

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

// Crear proveedor
async function create(req, res, next) {
  if (!onlyAdmin(req, res)) return;

  try {
    const payload = {
      ...req.body,
      empresa_id: req.empresa_id
    };

    const data = await service.create(req, payload);

    res.status(201).json({ 
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

// Actualizar proveedor
async function update(req, res, next) {
  if (!onlyAdmin(req, res)) return;

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

// Eliminar proveedor
async function remove(req, res, next) {
  if (!onlyAdmin(req, res)) return;

  try {
    await service.remove(req, req.empresa_id, req.params.id);
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
  listByEmpresa,
  get,
  create,
  update,
  remove
};
