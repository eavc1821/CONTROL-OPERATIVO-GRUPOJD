const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const empresa = require('../../middlewares/empresa');
const ctrl = require('./controller');

// Reporte global
router.get('/resumen', auth, empresa, ctrl.resumen);

// Totales por proveedor
// router.get('/proveedores', auth, ctrl.totalesProveedor);

// Totales por tipo de pago
router.get('/tipo-pago', auth, empresa, ctrl.totalesTipoPago);

// Totales mensuales
router.get('/mensual', auth, empresa, ctrl.mensual);

// Ranking proveedores
router.get('/ranking', auth, empresa, ctrl.ranking);

// Resumen por solicitud
router.get('/solicitud/:id', auth, empresa, ctrl.resumenPorSolicitud);

// GET /reportes/dashboard
router.get("/dashboard", auth, empresa, ctrl.dashboard);

// GET /reportes/meses
router.get("/meses", auth, empresa, ctrl.meses);

// GET /reportes/dashboard/:periodo
router.get("/dashboard/:periodo", auth, empresa, ctrl.dashboardPorMes);

// GET /reportes/proveedores
router.get("/proveedores", auth, empresa, ctrl.proveedoresReporte);

// GET /reportes/proveedor/:id
router.get("/proveedores/:id/perfil", auth, empresa, ctrl.proveedorPerfil);

// POST /reportes/export/pdf
router.post(
  "/export/pdf",
  auth,
  empresa,
  ctrl.exportDetallePDF
);



module.exports = router;
