const express = require("express");
const router = express.Router();

const auth = require("../../middlewares/auth");
const empresa = require("../../middlewares/empresa");
const requirePermiso = require("../../middlewares/requirePermiso");
const upload = require("../../middlewares/upload");

const pagosService = require("./service");

/**
 * GET /pagos
 * Listar pagos (opcionalmente filtrados por solicitud)
 * Query params:
 *  - solicitud_id
 */
router.get("/", auth, empresa, async (req, res, next) => {
  try {
    const ctx = {
      empresaId: req.empresa_id
    };

    const filters = {};

    if (req.query.solicitud_id) {
      const sid = Number(req.query.solicitud_id);
      if (Number.isNaN(sid)) {
        return res.status(400).json({
          ok: false,
          message: "solicitud_id inválido"
        });
      }
      filters.solicitud_id = sid;
    }

    const rows = await pagosService.list(ctx, filters);

    res.json({
      ok: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /pagos/:id
 * Obtener pago por ID
 */
router.get("/:id", auth, empresa, async (req, res, next) => {
  try {
    const ctx = {
      empresaId: req.empresa_id
    };

    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID de pago inválido"
      });
    }

    const pago = await pagosService.getById(ctx, id);

    if (!pago) {
      return res.status(404).json({
        ok: false,
        message: "Pago no encontrado"
      });
    }

    res.json({
      ok: true,
      data: pago
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /pagos/:id/factura
 * Obtener la factura vigente del pago
 */
router.get("/:id/factura", auth, empresa, async (req, res, next) => {
  try {
    const ctx = {
      empresaId: req.empresa_id
    };

    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID de pago inválido"
      });
    }

    const archivo = await pagosService.getFactura(ctx, id);

    if (!archivo) {
      return res.status(404).json({
        ok: false,
        message: "Este pago no tiene factura asociada"
      });
    }

    res.json({
      ok: true,
      data: archivo
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /pagos/:id/factura
 * Reemplazar factura de un pago
 * Requiere permiso: pagos.editar
 */
router.post(
  "/:id/factura",
  auth,
  empresa,
  requirePermiso("pagos.editar"),
  upload.single("factura"),
  async (req, res, next) => {
    try {
      const ctx = {
        empresaId: req.empresa_id,
        usuarioId: req.usuario.id
      };

      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({
          ok: false,
          message: "ID de pago inválido"
        });
      }

      const result = await pagosService.updateFactura(ctx, id, req.file);

      res.json({
        ok: true,
        message: "Factura del pago reemplazada correctamente",
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
