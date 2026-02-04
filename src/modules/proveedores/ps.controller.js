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
// Listar sucursales
// ==========================
async function listByProveedor(req, res, next) {
  try {
    const data = await service.listByProveedor(req.params.id);
    res.json({
      ok: true,
      data
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
      data
    });

  } catch (err) {
    // 🧠 Error de negocio: CAI duplicado
    if (err.code === "CAI_DUPLICADO") {
      return res.status(409).json({
        ok: false,
        message: err.message
      });
    }

    next(err);
  }
}

async function get(req, res, next) {
  try {
    const { proveedorId, sucursalId } = req.params;

    const data = await service.getById(
      Number(proveedorId),
      Number(sucursalId)
    );

    res.json({
      ok: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

// ==========================
// Actualizar sucursal
// ==========================
async function update(req, res, next) {
  if (!onlyAdmin(req, res)) return;

  try {
    const { proveedorId, sucursalId } = req.params;

    const data = await service.update(
      req,
      Number(proveedorId),
      Number(sucursalId),
      req.body
    );

    res.json({
      ok: true,
      data
    });

  } catch (err) {
    if (err.code === "CAI_DUPLICADO") {
      return res.status(409).json({
        ok: false,
        message: err.message
      });
    }

    next(err);
  }
}



module.exports = {
  listByProveedor,
  create,
  get,
  update
};
