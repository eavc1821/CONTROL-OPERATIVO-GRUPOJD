const express = require("express");
const {
  crearProveedorV2
} = require("../controllers/proveedores.v2.controller");

const router = express.Router();

router.post("/v2", crearProveedorV2);

module.exports = router;
