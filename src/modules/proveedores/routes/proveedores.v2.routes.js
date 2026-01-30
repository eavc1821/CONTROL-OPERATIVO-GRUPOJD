const express = require("express");
const {
  crearProveedorV2
} = require("../controllers/proveedores.v2.controller");

const router = express.Router();

router.post("/v2", crearProveedorV2);

// routes/proveedores.routes.js
router.get("/proveedores/v2", authMiddleware, listarProveedoresV2);

router.get("/proveedores/listado", authMiddleware, listarProveedoresListado);

module.exports = router;
