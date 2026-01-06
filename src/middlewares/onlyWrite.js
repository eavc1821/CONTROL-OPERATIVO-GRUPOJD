module.exports = function onlyWrite(req, res, next) {
  // 👑 superadmin: siempre permitido
  if (req.usuario?.rol === "superadmin") {
    return next();
  }

  // 🟢 admin por empresa: permitido
  if (req.empresaRol === "admin") {
    return next();
  }

  // 🔒 resto: solo lectura
  return res.status(403).json({
    ok: false,
    message: "Solo lectura"
  });
};
