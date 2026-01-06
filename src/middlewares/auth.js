const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ ok: false, message: "Token faltante" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ UNIFICADO
    req.usuario = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Token inválido" });
  }
};
