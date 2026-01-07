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


async function preview(req, res, next) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        ok: false,
        message: "Token requerido"
      });
    }

    const solicitud = await service.previewByToken(token);

    res.json({
      ok: true,
      solicitud
    });
  } catch (err) {
    res.status(404).json({
      ok: false,
      message: err.message
    });
  }
}

module.exports = {
  resolve,
  preview
};
