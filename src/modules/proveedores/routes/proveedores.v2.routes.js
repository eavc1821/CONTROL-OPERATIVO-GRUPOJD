import { Router } from "express";
import { crearProveedorV2 } from "../controllers/proveedores.v2.controller.js";

const router = Router();

router.post("/v2", crearProveedorV2);

export default router;
