const service = require('./service');

async function register(req, res, next) {
  try {
    const user = await service.register(req.body);
    res.status(201).json({ ok: true, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { user, token } = await service.login(req.body.email, req.body.password);
    res.json({ ok: true, user, token });
  } catch (err) {
    next(err);
  }
}

async function listarUsuarios(req, res, next) {
  try {
    const users = await service.listarUsuarios();
    res.json({ ok: true, data: users });
  } catch (err) { next(err); }
}

async function obtenerUsuario(req, res, next) {
  try {
    const user = await service.obtenerUsuario(Number(req.params.id));
    res.json({ ok: true, data: user });
  } catch (err) { next(err); }
}

async function crearUsuarioAdmin(req, res, next) {
  try {
    const user = await service.crearUsuarioAdmin(req.body);
    res.status(201).json({ ok: true, data: user });
  } catch (err) { next(err); }
}

async function actualizarUsuario(req, res, next) {
  try {
    const user = await service.actualizarUsuario(Number(req.params.id), req.body);
    res.json({ ok: true, data: user });
  } catch (err) { next(err); }
}

async function asignarEmpresas(req, res, next) {
  try {
    await service.asignarEmpresas(
      Number(req.params.id),
      req.body.empresas
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    // 👑 SOLO SUPERADMIN
    if (req.usuario.rol !== "superadmin") {
      return res.status(403).json({
        ok: false,
        message: "No autorizado para resetear contraseñas"
      });
    }

    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        ok: false,
        message: "La contraseña debe tener al menos 8 caracteres"
      });
    }

    await service.resetPassword(id, password);

    res.json({
      ok: true,
      message: "Contraseña reseteada correctamente"
    });
  } catch (err) {
    next(err);
  }
}



module.exports = { 
  register, 
  login, 
  listarUsuarios, 
  obtenerUsuario, 
  crearUsuarioAdmin, 
  actualizarUsuario, 
  asignarEmpresas,
  resetPassword 
};
