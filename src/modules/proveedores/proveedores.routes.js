const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const empresa = require('../../middlewares/empresa');
const requireEmpresaAdmin = require('../../middlewares/requireEmpresaAdmin');
const requirePermiso = require('../../middlewares/requirePermiso');
const { validate } = require('../../core/validators');
const { createProveedorSchema, updateProveedorSchema } = require('./proveedores.schema');
const ctrl = require('./controller');

router.get('/', auth, ctrl.list);


// Proveedores por empresa (para solicitudes)
router.get(
  '/empresa',
  auth,
  empresa,
  ctrl.listByEmpresa
);


router.get('/:id', auth, ctrl.get);


router.post(
  '/',
  auth,
  requirePermiso("proveedores.crear"),
  validate(createProveedorSchema),
  ctrl.create
);


router.put(
  '/:id',
  auth,
  requirePermiso("proveedores.editar"),
  validate(updateProveedorSchema),
  ctrl.update
);


router.delete(
  '/:id',
  auth,
  requirePermiso("proveedores.eliminar"),
  ctrl.remove
);


module.exports = router;
