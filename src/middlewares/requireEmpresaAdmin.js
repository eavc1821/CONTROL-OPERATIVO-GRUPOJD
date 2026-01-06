module.exports = (req, res, next) => {
  if (
    req.empresaRol !== "admin" &&
    req.usuario?.rol !== "superadmin"
  ) {
    return res.status(403).json({
      ok: false,
      message: "Solo administradores de la empresa"
    });
  }
  next();
};


