// src/modules/aprobaciones/controller.js
const service = require("./service");

async function resolve(req, res, next) {
  try {
    const result = await service.resolveByToken({
      token: req.body.token,
      accion: req.body.accion,
      comentario: req.body.comentario,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.status(200).json({
      ok: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  resolve
};
