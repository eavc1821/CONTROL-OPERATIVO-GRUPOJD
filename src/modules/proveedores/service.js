const repo = require("./repository");
const bitacora = require("../bitacora/service");

// Listados (sin bitácora)
async function listGlobal() {
  return repo.getAll();
}

async function listByEmpresa(empresaId) {
  return repo.getByEmpresa(empresaId);
}

async function get(id) {
  return repo.getById(id);
}

// Crear proveedor
async function create(req, data) {
  const proveedor = await repo.create(data);

  await bitacora.registrar(
    {
      usuario_id: req.usuario.id,
      empresa_id: data.empresa_id
    },
    {
      modulo: "proveedores",
      accion: "CREATE",
      descripcion: `Creó el proveedor ${proveedor.nombre}`,
      data_nueva: proveedor
    }
  );

  return proveedor;
}


// Actualizar proveedor
async function update(req, id, data) {
  const anterior = await repo.getById(id);

  if (!anterior) {
    throw new Error("Proveedor no encontrado");
  }

  const actualizado = await repo.update(id, data);

  await bitacora.registrar(
    {
      usuario_id: req.usuario.id
    },
    {
      modulo: "proveedores",
      accion: "UPDATE",
      descripcion: `Actualizó el proveedor ${anterior.nombre}`,
      data_anterior: anterior,
      data_nueva: actualizado
    }
  );


  return actualizado;
}

// Eliminar proveedor (por empresa)
async function remove(req, empresaId, id) {
  const anterior = await repo.getById(id);

  if (!anterior) {
    throw new Error("Proveedor no encontrado");
  }

  await repo.remove(empresaId, id);

  await bitacora.registrar(
  {
    usuario_id: req.usuario.id,
    empresa_id: empresaId
  },
  {
    modulo: "proveedores",
    accion: "DELETE",
    descripcion: `Eliminó el proveedor ${anterior.nombre} de la empresa ${empresaId}`,
    data_anterior: anterior
  }
);


  return true;
}

module.exports = {
  listGlobal,
  listByEmpresa,
  get,
  create,
  update,
  remove
};
