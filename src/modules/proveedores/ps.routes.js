const express = require("express");
const controller = require("./ps.controller");
const authMiddleware = require("../../middlewares/auth");

const router = express.Router();

router.get(
  "/proveedores/:proveedorId/sucursales/:sucursalId",
  authMiddleware,
  controller.get
);

router.put(
  "/proveedores/:proveedorId/sucursales/:sucursalId",
  authMiddleware,
  controller.update
);

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
