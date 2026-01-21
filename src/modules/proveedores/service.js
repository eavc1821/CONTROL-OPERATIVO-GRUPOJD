const repo = require("./repository");
const bitacora = require("../bitacora/service");

// 🔒 Función privada (NO exportar)
function normalizarRango(valor) {
  if (!valor) return null;
  return valor.replace(/-/g, "");
}

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

// ==========================
// Crear proveedor
// ==========================
async function create(req, data) {

  // ✅ Validación semántica de rango
  if (data.rango_factura_desde && data.rango_factura_hasta) {
    const desde = normalizarRango(data.rango_factura_desde);
    const hasta = normalizarRango(data.rango_factura_hasta);

    if (desde > hasta) {
      throw new Error("El rango de facturación es inválido");
    }
  }

  // 🔒 CONTRATO BLINDADO (igual que solicitudes)
  const payload = {
    ...data,
    empresa_id: req.empresa_id
  };

  const proveedor = await repo.create(payload);

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

  // ✅ Validación semántica de rango
  if (data.rango_factura_desde && data.rango_factura_hasta) {
    const desde = normalizarRango(data.rango_factura_desde);
    const hasta = normalizarRango(data.rango_factura_hasta);

    if (desde > hasta) {
      throw new Error("El rango de facturación es inválido");
    }
  }

  // 🔒 CONTRATO BLINDADO
  const payload = {
    ...data,
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

module.exports = {
  listGlobal,
  listByEmpresa,
  get,
  create,
  update,
  remove
};
