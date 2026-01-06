const repo = require('./repository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const empresasRepo = require('../empresas/repository');
const bitacora = require('../bitacora/service');



async function register(data) {
  const existing = await repo.findByEmail(data.email);
  if (existing) throw new Error("El correo ya está registrado");

  const password_hash = await bcrypt.hash(data.password, 10);

  const usuario = await repo.create({
  nombre: data.nombre,
  email: data.email,
  password_hash,
  rol: data.rol || 'viewer'
});

await bitacora.registrar(
  {
    usuario_id: usuario.id
  },
  {
    modulo: "usuarios",
    accion: "CREATE",
    descripcion: `Registro de usuario ${usuario.email}`,
    data_nueva: {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol
    }
  }
);



return usuario;
}

function buildEmpresaTree(rows) {
  const map = {};
  const roots = [];

  rows.forEach(e => {
    map[e.id] = { ...e, children: [] };
  });

  rows.forEach(e => {
    if (e.parent_id) {
      map[e.parent_id]?.children.push(map[e.id]);
    } else {
      roots.push(map[e.id]);
    }
  });

  return roots;
}



async function login(email, password) {
  const user = await repo.findByEmail(email);
  if (!user) throw new Error("Credenciales inválidas");

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error("Credenciales inválidas");

  // Generar token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      rol: user.rol
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  delete user.password_hash;

  await bitacora.registrar(
  {
    usuario_id: user.id
  },
  {
    modulo: "auth",
    accion: "LOGIN",
    descripcion: `Inicio de sesión del usuario ${user.email}`
  }
);

  return { user, token };
}

async function listarUsuarios() {
  return repo.listarUsuarios();
}

async function obtenerUsuario(id) {
  return repo.obtenerUsuario(id);
}


async function crearUsuarioAdmin(data) {
  const password_hash = await bcrypt.hash(data.password, 10);

  // 🔒 Validación obligatoria
  if (data.rol === "admin" && (!data.empresas || data.empresas.length === 0)) {
    throw new Error("Un administrador debe tener al menos una empresa asignada");
  }

  const usuario = await repo.create({
    nombre: data.nombre,
    email: data.email,
    password_hash,
    rol: data.rol || "viewer",
  });

  // 🟢 Asignar empresas si es admin
  if (data.rol === "admin") {
    await repo.setEmpresas(usuario.id, data.empresas);
  }

  await bitacora.registrar(
  {
    usuario_id: usuario.id
  },
  {
    modulo: "usuarios",
    accion: "CREATE_ADMIN",
    descripcion: `Creó usuario ${usuario.email} con rol ${usuario.rol}`,
    data_nueva: {
      id: usuario.id,
      rol: usuario.rol,
      empresas: data.empresas || []
    }
  }
);


  return usuario;
}


async function actualizarUsuario(id, data) {
  return repo.actualizarUsuario(id, data);
}

async function asignarEmpresas(usuarioId, empresas) {
  const result = await repo.setEmpresas(usuarioId, empresas);

  await bitacora.registrar(
  {
    usuario_id: usuarioId
  },
  {
    modulo: "usuarios",
    accion: "ASSIGN_EMPRESAS",
    descripcion: `Asignación de empresas al usuario ${usuarioId}`,
    data_nueva: { empresas }
  }
);


}



async function resetPassword(id, password) {
  const hash = await bcrypt.hash(password, 10);
  await repo.updatePassword(id, hash);

  await bitacora.registrar(
  {
    usuario_id: id
  },
  {
    modulo: "auth",
    accion: "RESET_PASSWORD",
    descripcion: `Reseteo de contraseña del usuario ${id}`
  }
);


}

module.exports = {
  register,
  login,
  buildEmpresaTree,
  listarUsuarios,
  obtenerUsuario,
  crearUsuarioAdmin,
  actualizarUsuario,
  asignarEmpresas,
  resetPassword
};
