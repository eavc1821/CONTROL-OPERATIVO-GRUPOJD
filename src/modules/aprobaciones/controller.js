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

    switch (result.status) {
      case "TOKEN_INVALIDO":
        return res.status(400).json({
          ok: false,
          message: "El enlace no es válido"
        });

      case "SOLICITUD_RESUELTA":
        return res.status(200).json({
          ok: false,
          message: "Esta solicitud ya fue resuelta"
        });

      case "OK": {
        const mensaje =
          result.resultado === "aprobada"
            ? "Solicitud aprobada correctamente"
            : "Solicitud rechazada correctamente";

        const aceptaHtml =
          req.headers.accept && req.headers.accept.includes("text/html");

        if (aceptaHtml) {
          return res.send(`
            <html>
              <head>
                <meta charset="utf-8"/>
                <title>Resultado</title>
                <style>
                  body { font-family: system-ui; background:#f4f6f8; padding:40px; }
                  .card { background:white; max-width:500px; margin:auto; padding:30px; border-radius:10px; box-shadow:0 10px 25px rgba(0,0,0,.1); text-align:center;}
                  .ok { color:#16a34a; font-size:18px; }
                </style>
              </head>
              <body>
                <div class="card">
                  <div class="ok">${mensaje}</div>
                  <p>Ya puede cerrar esta ventana.</p>
                </div>
              </body>
            </html>
          `);
        }

        return res.status(200).json({
          ok: true,
          message: mensaje
        });
      }

      default:
        return res.status(500).json({
          ok: false,
          message: "Estado de aprobación no reconocido"
        });
    }
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

    const result = await service.previewByToken(token);

    switch (result.status) {
      case "TOKEN_INVALIDO":
        return res.status(400).json({
          ok: false,
          message: "El enlace no es válido"
        });

      case "SOLICITUD_RESUELTA":
        return res.status(200).json({
          ok: false,
          message: "Esta solicitud ya fue resuelta"
        });

      case "OK":
        return res.status(200).json({
          ok: true,
          solicitud: result.solicitud
        });

      default:
        return res.status(500).json({
          ok: false,
          message: "Estado de previsualización no reconocido"
        });
    }

  } catch (err) {
    next(err);
  }
}


module.exports = {
  resolve,
  preview
};
