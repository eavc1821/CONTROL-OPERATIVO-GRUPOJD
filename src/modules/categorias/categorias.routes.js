// src/modules/categorias/categorias.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const ctrl = require('./controller');

router.get("/", auth, ctrl.list);
router.get("/:id", auth, ctrl.get);
router.post("/", auth, ctrl.create);
router.put("/:id", auth, ctrl.update);
router.delete("/:id", auth, ctrl.remove);

module.exports = router;

