const repo = require("./repository");
const bitacora = require("../bitacora/service");

// ==========================
// Listados (sin bitácora)
// ==========================
async function listGlobal() {
  return repo.getAll();
}

async function listByEmpresa(empresaId) {
  return repo.getByEmpresa(empresaId);
}

async function get(id) {
  return repo.getById(id);
}

// ==========================
// Crear proveedor
// ==========================
async function create(req, data) {

  // ❌ eliminar campos que NO pertenecen al proveedor
  const {
    cai,
    rango_factura_desde,
    rango_factura_hasta,
    fecha_limite_emision,
    ...proveedorData
  } = data;

  // 🔒 contrato blindado
  const payload = {
    ...proveedorData,
    empresa_id: req.empresa_id
  };

  let proveedor = null;

  if (payload.ruc) {
    proveedor = await repo.getByRuc(payload.ruc);
  }

  const esNuevoProveedor = !proveedor;

  if (esNuevoProveedor) {
    proveedor = await repo.create(payload);

    await bitacora.registrar(
      {
        usuario_id: req.usuario.id,
        empresa_id: req.empresa_id
      },
      {
        modulo: "proveedores",
        accion: "CREATE",
        descripcion: `Creó el proveedor ${proveedor.nombre}`,
        data_nueva: proveedor
      }
    );
  }

  // ✅ siempre asegurar relación empresa–proveedor
  await repo.ensureEmpresaProveedor(
    proveedor.id,
    req.empresa_id
  );

  return proveedor;
}


// ==========================
// Actualizar proveedor
// ==========================
async function update(req, id, data) {
  const anterior = await repo.getById(id);

  if (!anterior) {
    throw new Error("Proveedor no encontrado");
  }

  // ❌ eliminar campos que NO pertenecen al proveedor
  const {
    cai,
    rango_factura_desde,
    rango_factura_hasta,
    fecha_limite_emision,
    ...proveedorData
  } = data;

  const payload = {
    ...proveedorData,
    empresa_id: req.empresa_id
  };

  const actualizado = await repo.update(id, payload);

  await bitacora.registrar(
    {
      usuario_id: req.usuario.id,
      empresa_id: req.empresa_id
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

// ==========================
// Eliminar proveedor
// ==========================
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

async function getByRuc(ruc) {
  return repo.getByRuc(ruc);
}


module.exports = {
  listGlobal,
  listByEmpresa,
  get,
  create,
  update,
  remove,
  getByRuc
};
