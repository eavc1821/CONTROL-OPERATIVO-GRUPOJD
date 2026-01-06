const usuarioRepo = require("../modules/usuarios/repository");
const { buildEmpresaTree } = require("../modules/usuarios/service");
const assertCtx = require("../utils/assertReporteCtx");

/* =====================================================
   HELPERS (DEBEN ESTAR FUERA DEL MIDDLEWARE)
   ===================================================== */

function findEmpresaRecursiva(empresas, empresaId) {
  for (const emp of empresas) {
    if (Number(emp.id) === Number(empresaId)) return emp;
    if (emp.children?.length) {
      const found = findEmpresaRecursiva(emp.children, empresaId);
      if (found) return found;
    }
  }
  return null;
}

function collectEmpresaIds(emp) {
  let ids = [];
  for (const child of emp.children || []) {
    ids.push(child.id);
    if (child.children?.length) {
      ids = ids.concat(collectEmpresaIds(child));
    }
  }
  return ids;
}

/* =====================================================
   MIDDLEWARE
   ===================================================== */

module.exports = async (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({
      ok: false,
      message: "Usuario no autenticado",
    });
  }

  // 1. Cargar empresas del usuario
  if (
    req.usuario.rol === "superadmin" ||
    req.usuario.rol === "viewer" ||
    req.usuario.rol === "admin"
  ) {
    const rows = await usuarioRepo.getEmpresasJerarquicas();
    req.usuario.empresas = buildEmpresaTree(rows);
  }

  // 2. Empresa seleccionada
  const rawEmpresaId =
    req.query.empresa_id ||
    req.body.empresa_id ||
    req.headers["x-empresa-id"];

  if (rawEmpresaId === undefined || rawEmpresaId === null) {
    return res.status(400).json({
      ok: false,
      message: "Debe seleccionar una empresa",
    });
  }

  const empresaId = Number(rawEmpresaId);

  if (Number.isNaN(empresaId)) {
    return res.status(400).json({
      ok: false,
      message: "empresa_id inválido",
    });
  }

  // 3. MODO GENERAL
  if (empresaId === 0) {
    req.empresa_id = 0;
    req.empresa_ids = [];
    req.empresaModo = "GENERAL";
    req.empresaTipo = "PADRE";
    req.empresaRol = req.usuario.rol === "viewer" ? "read" : "admin";
    return next();
  }

  // 4. Empresa específica
  const empresa = findEmpresaRecursiva(req.usuario.empresas, empresaId);

  if (!empresa) {
    return res.status(403).json({
      ok: false,
      message: "No tiene acceso a esta empresa",
    });
  }

  req.empresa_id = empresaId;

if (empresa.children && empresa.children.length > 0) {
  // EMPRESA PADRE
  req.empresaTipo = "PADRE";
  req.empresa_ids = [empresaId, ...collectEmpresaIds(empresa)];
} else {
  // EMPRESA HIJA
  req.empresaTipo = "HIJA";
  req.empresa_ids = [empresaId];
}

req.empresaModo = "EMPRESA";
req.empresaRol = req.usuario.rol === "viewer" ? "read" : "admin";


  return next();
};

