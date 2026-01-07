// src/modules/aprobaciones/aprobaciones.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("./controller");
const { validate } = require("../../core/validators");
const { resolveAprobacionSchema } = require("./aprobaciones.schema");

router.post(
  "/resolve",
  validate(resolveAprobacionSchema),
  ctrl.resolve
);

router.get(
  "/preview",
  ctrl.preview);

module.exports = router;
