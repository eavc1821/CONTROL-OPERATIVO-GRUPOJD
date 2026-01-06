const usuariosEmpresasRepo = require('../modules/usuarios_empresas/repository'); 
const empresasRepo = require('../modules/empresas/repository'); 

module.exports = function verificarPermisos(rolesPermitidos = []) {
  return async (req, res, next) => {
    try {
      // 🔐 Usuario autenticado
      const usuarioId = req.usuario?.id;
      const empresaId = req.empresa_id;

      if (!usuarioId) {
        return res.status(401).json({
          ok: false,
          msg: 'No autorizado'
        });
      }

      // 👑 SUPERADMIN: bypass total
      if (req.usuario.rol === 'superadmin') {
        req.empresaRol = 'superadmin';
        return next();
      }

      // 🏢 Validar relación usuario–empresa
     const empresaRaizId = await empresasRepo.getEmpresaRaiz(empresaId);

      const row = await usuariosEmpresasRepo.findByUsuarioEmpresa(
        usuarioId,
        empresaRaizId
      );


      if (!row) {
        return res.status(403).json({
          ok: false,
          msg: 'No tiene acceso a esta empresa'
        });
      }

      // 🔑 Admin de empresa siempre permitido
      if (row.rol === 'admin') {
        req.empresaRol = 'admin';
        return next();
      }

      // 🎯 Validar roles permitidos
      if (rolesPermitidos.length && !rolesPermitidos.includes(row.rol)) {
        return res.status(403).json({
          ok: false,
          msg: 'No tiene permisos para esta acción'
        });
      }

      // 🧾 Guardar rol de empresa
      req.empresaRol = row.rol;
      next();

    } catch (err) {
      console.error('[verificarPermisos] error:', err);
      next(err);
    }
  };
};
