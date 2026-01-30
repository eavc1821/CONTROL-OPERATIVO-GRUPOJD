const express = require("express");
const router = express.Router();

const auth = require("../../middlewares/auth");
const empresa = require("../../middlewares/empresa");
const service = require("./service");

router.get("/", auth, empresa, async (req, res, next) => {
  try {
    const ctx = {
      empresaId: req.empresa_id
    };

    const { metodo_pago } = req.query;

    const data = await service.list(ctx, metodo_pago);

    res.json({
      ok: true,
      data
    });
  } catch (err) {
    next(err);
  }
});

router.get("/bancos", auth, empresa, async (req, res, next) => {
  try {
    const { metodo_pago } = req.query;
    const data = await service.listBancos(req.empresa_id, metodo_pago);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
});

router.get("/cuentas", auth, empresa, async (req, res, next) => {
  try {
    const { metodo_pago, banco } = req.query;
    const data = await service.listCuentas(req.empresa_id, metodo_pago, banco);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
