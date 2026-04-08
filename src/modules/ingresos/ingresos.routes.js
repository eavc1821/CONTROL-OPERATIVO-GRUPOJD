const express = require("express");
const router = express.Router();

const auth = require("../../middlewares/auth");
const empresa = require("../../middlewares/empresa");
const ctrl = require("./controller");

const { validate } = require("../../core/validators");
const { createIngresoSchema } = require("./ingresos.schema");

router.get("/", auth, empresa, ctrl.list);

router.post(
  "/",
  auth,
  empresa,
  validate(createIngresoSchema),
  ctrl.create
);

module.exports = router;