const repo = require("./repository");
const bitacora = require("../bitacora/service");

// Listar (NO bitácora)
async function list() {
  return repo.findAll();
}

async function get(id) {
  return repo.findById(id);
}

// Crear
async function create(req, data) {
  const categoria = await repo.create(data);

  await bitacora.registrar(
  {
    usuario_id: req.usuario.id
  },
  {
    modulo: "categorias",
    accion: "CREATE",
    descripcion: `Creó la categoría ${categoria.nombre}`,
    data_nueva: categoria
  }
);


  return categoria;
}

// Actualizar
async function update(req, id, data) {
  const anterior = await repo.findById(id);

  if (!anterior) {
    throw new Error("Categoría no encontrada");
  }

  const actualizado = await repo.update(id, data);

 await bitacora.registrar(
  {
    usuario_id: req.usuario.id
  },
  {
    modulo: "categorias",
    accion: "UPDATE",
    descripcion: `Actualizó la categoría ${anterior.nombre}`,
    data_anterior: anterior,
    data_nueva: actualizado
  }
);


  return actualizado;
}

// Eliminar
async function remove(req, id) {
  const anterior = await repo.findById(id);

  if (!anterior) {
    throw new Error("Categoría no encontrada");
  }

  await repo.remove(id);

  await bitacora.registrar(
  {
    usuario_id: req.usuario.id
  },
  {
    modulo: "categorias",
    accion: "DELETE",
    descripcion: `Eliminó la categoría ${anterior.nombre}`,
    data_anterior: anterior
  }
);


  return true;
}

module.exports = {
  list,
  get,
  create,
  update,
  remove
};
