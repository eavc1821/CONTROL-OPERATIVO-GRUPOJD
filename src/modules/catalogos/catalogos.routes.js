const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth");
const empresa = require("../../middlewares/empresa");
const ctrl = require("./controller");

router.get("/clientes-ingresos", auth, empresa, ctrl.getClientesIngresos);
router.get("/operadores", auth, empresa, ctrl.getOperadores);
router.get("/cisternas", auth, empresa, ctrl.getCisternas);

module.exports = router;