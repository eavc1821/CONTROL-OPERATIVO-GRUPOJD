const express = require('express');
const router = express.Router();
const { validate } = require('../../core/validators');
const { userRegisterSchema, userLoginSchema } = require('./usuarios.schema');
const ctrl = require('./controller');
const auth = require("../../middlewares/auth");
const requirePermiso = require("../../middlewares/requirePermiso");



router.post('/register', validate(userRegisterSchema), ctrl.register);
router.post('/login', validate(userLoginSchema), ctrl.login);
router.get("/auth/me", auth, async (req, res, next) => {
  try {
    const userId = req.usuario.id;

    const userRepo = require("./repository");
    const empresasRepo = require("../empresas/repository");
    const { buildEmpresaTree } = require("./service");

    const user = await userRepo.findById(userId);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Token inválido o usuario inexistente"
      });
    }

    delete user.password_hash;

    let empresas = [];

    if (user.rol === "superadmin" || user.rol === "viewer") {
      const rows = await empresasRepo.getEmpresasJerarquicas();
      empresas = buildEmpresaTree(rows);
    } else if (user.rol === "admin") {
      const rows =
        await empresasRepo.getEmpresasConDescendientesByUsuario(user.id);
      empresas = buildEmpresaTree(rows);
    }

    if (
      (user.rol === "superadmin" || user.rol === "viewer") &&
      empresas.length === 0
    ) {
      return res.status(403).json({
        ok: false,
        error: "Usuario sin empresas asignadas"
      });
    }

    user.empresas = empresas;

    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
});

router.put(
  "/:id/reset-password",
  auth,
  ctrl.resetPassword
);





function onlyAdmin(req, res, next) {
  if (req.usuario.rol !== "admin" && req.usuario.rol !== "superadmin") {
    return res.status(403).json({ ok: false, error: "Acceso denegado" });
  }
  next();
}


// CRUD ADMIN
router.get("/", auth, onlyAdmin, ctrl.listarUsuarios);
router.get("/:id", auth, onlyAdmin, ctrl.obtenerUsuario);
router.post("/", auth, onlyAdmin, ctrl.crearUsuarioAdmin);
router.put("/:id", auth, onlyAdmin, ctrl.actualizarUsuario);
router.put("/:id/empresas", auth, onlyAdmin, ctrl.asignarEmpresas);




module.exports = router;
