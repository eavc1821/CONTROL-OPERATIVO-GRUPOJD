const service = require("./ps.sevice");

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

// ==========================
// Listar sucursales por proveedor
// ==========================
async function listByProveedor(req, res, next) {
  try {
    const data = await service.listByProveedor(req.params.id);

    res.json({
      ok: true,
      data,
      proveedor_id: req.params.id,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) {
    next(err);
  }
}

// ==========================
// Crear sucursal
// ==========================
async function create(req, res, next) {
  if (!onlyAdmin(req, res)) return;

  try {
    const data = await service.create(
      req,
      req.params.id,
      req.body
    );

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

module.exports = {
  listByProveedor,
  create
};
