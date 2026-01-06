const permisosMap = require("../core/permisos.map");

module.exports = function requirePermiso(permiso) {
  return (req, res, next) => {
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no autenticado"
      });
    }

    // 👑 SUPERADMIN: acceso total
    if (usuario.rol === "superadmin") {
      return next();
    }

    const rolEmpresa = req.empresaRol || usuario.rol;
    const permisos = permisosMap[rolEmpresa] || [];

    // Permiso wildcard
    if (permisos.includes("*")) {
      return next();
    }

    if (!permisos.includes(permiso)) {
      return res.status(403).json({
        ok: false,
        message: "No tiene permisos para esta acción"
      });
    }

    next();
  };
};
