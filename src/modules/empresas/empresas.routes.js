const express = require("express");
const router = express.Router();

const auth = require("../../middlewares/auth");
const requirePermiso = require("../../middlewares/requirePermiso");
const ctrl = require("./controller");

router.get(
  "/",
  auth,
  requirePermiso("empresas.listar"),
  ctrl.listar
);

module.exports = router;
