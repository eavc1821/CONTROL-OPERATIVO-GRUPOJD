const express = require('express');
const router = express.Router();
const upload = require('../../middlewares/upload');
const auth = require('../../middlewares/auth');
const empresa = require('../../middlewares/empresa');
const requireEmpresaAdmin = require('../../middlewares/requireEmpresaAdmin');
const requirePermiso = require('../../middlewares/requirePermiso');
const onlyWrite = require('../../middlewares/onlyWrite');
const ctrl = require('./controller');

// Validadores
const { validate } = require('../../core/validators');
const { 
  createSolicitudSchema,
  approveSolicitudSchema,
  rejectSolicitudSchema,
  registrarPagoSchema 
} = require('./solicitudes.schema');

// ======================================================
// 🟦 1. RUTAS DE PAGOS (DEBEN IR ARRIBA DE '/:id')
// ======================================================

// Historial de pagos de una solicitud
router.get(
  "/:id/pagos",
  auth,
  empresa,
  ctrl.listPagos
);

// Registrar un pago (SOLO ADMIN DE EMPRESA)
router.post(
  "/:id/pagos",
  auth,
  empresa,
  requirePermiso("solicitudes.pagar"),
   upload.single("factura"),    
  ctrl.registrarPago
);



// ======================================================
// 🟩 2. RUTAS DE SOLICITUDES
// ======================================================

// Listar
router.get(
  '/',
  auth,
  empresa,
  requirePermiso("solicitudes.listar"),
  ctrl.list
);


// Crear
router.post(
  "/",
  auth,
  empresa,
  requirePermiso("solicitudes.crear"),
  onlyWrite,
  ctrl.create
);


// Obtener por ID (DEBE IR DESPUÉS DE RUTAS MÁS ESPECÍFICAS)
router.get(
  '/:id',
  auth,
  empresa,
  requirePermiso("solicitudes.ver"),
  ctrl.getById
);


// Actualizar solicitud (solo si está pendiente)
router.put(
  "/:id",
  auth,
  empresa,
  requirePermiso("solicitudes.editar"),
  ctrl.update
);


// Aprobar con archivo
router.post(
  '/:id/approve',
  auth,
  empresa,
  requirePermiso("solicitudes.aprobar"),
  upload.single('factura'),
  validate(approveSolicitudSchema),
  ctrl.approveWithFile
);



// Rechazar
router.post(
  '/:id/reject',
  auth,
  empresa,
  requirePermiso("solicitudes.rechazar"),
  validate(rejectSolicitudSchema),
  ctrl.rejectWithComment
);



// Subir factura PDF
router.post(
  '/:id/factura',
  auth,
  empresa,
  requirePermiso("solicitudes.editar"),
  upload.single("factura"),
  ctrl.updateFactura
);



// Obtener factura PDF
router.get(
  "/:id/factura",
  auth,
  empresa,
  requirePermiso("solicitudes.ver"),
  ctrl.getFactura
);



module.exports = router;
