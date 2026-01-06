const repo = require("./repository");
const { buildEmpresaTree } = require("../usuarios/service");

async function listar(req, res, next) {
  try {
    const usuario = req.usuario;

    let rows = [];

    // 👑 superadmin y viewer → todas
    if (usuario.rol === "superadmin" || usuario.rol === "viewer") {
      rows = await repo.getEmpresasJerarquicas();
    }

    // 🟢 admin → solo asignadas
    if (usuario.rol === "admin") {
      rows = await repo.getEmpresasConDescendientesByUsuario(usuario.id);
    }

    const empresas = buildEmpresaTree(rows);

    res.json({
      ok: true,
      data: empresas,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
