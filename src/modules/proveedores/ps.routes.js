const express = require("express");
const controller = require("./ps.controller");
const authMiddleware = require("../../middlewares/auth");

const router = express.Router();

// /proveedores/:id/sucursales
router.get(
  "/proveedores/:id/sucursales",
  authMiddleware,
  controller.listByProveedor
);

router.post(
  "/proveedores/:id/sucursales",
  authMiddleware,
  controller.create
);

module.exports = router;
