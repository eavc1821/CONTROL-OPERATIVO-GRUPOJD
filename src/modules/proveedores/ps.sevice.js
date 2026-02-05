const repo = require("./ps.repository");
const proveedorRepo = require("../proveedores/repository");
const bitacora = require("../bitacora/service");

// 🔒 función privada
function normalizarRango(valor) {
  if (!valor) return null;
  return valor.replace(/-/g, "");
}

// ==========================
// Listar sucursales
// ==========================
async function listByProveedor(proveedorId) {
  return repo.getByProveedor(proveedorId);
}

// ==========================
// Crear sucursal
// ==========================
async function create(req, proveedorId, data) {

  // 1️⃣ Validar proveedor
  const proveedor = await proveedorRepo.getById(proveedorId);

  if (!proveedor) {
    throw new Error("Proveedor no encontrado");
  }

  // 2️⃣ Validación semántica de rango
  if (data.rango_factura_desde && data.rango_factura_hasta) {
    const desde = normalizarRango(data.rango_factura_desde);
    const hasta = normalizarRango(data.rango_factura_hasta);

    if (desde > hasta) {
      throw new Error("El rango de facturación es inválido");
    }
  }

  // 3️⃣ Contrato blindado
  const payload = {
    ...data,
    proveedor_id: proveedorId
  };

  const sucursal = await repo.create(payload);

  // 4️⃣ Bitácora
  await bitacora.registrar(
    {
      usuario_id: req.usuario.id,
      empresa_id: req.empresa_id
    },
    {
      modulo: "proveedores_sucursales",
      accion: "CREATE",
      descripcion: `Creó la sucursal ${sucursal.nombre} del proveedor ${proveedor.nombre}`,
      data_nueva: sucursal
    }
  );

  return sucursal;
}


async function getById(proveedorId, sucursalId) {
  const data = await repo.getById(proveedorId, sucursalId);

  if (!data) {
    throw new Error("Sucursal no encontrada");
  }

  return data;
}

async function update(req, proveedorId, sucursalId, data) {
  // 1️⃣ Obtener estado anterior de la sucursal
  const anterior = await repo.getById(proveedorId, sucursalId);

  if (!anterior) {
    throw new Error("Sucursal no encontrada");
  }

  // 2️⃣ Contrato explícito: la sucursal ES el proveedor
  const payload = {
    nombre: data.nombre,
    contacto: data.contacto,
    correo: data.correo,
    direccion: data.direccion,

    cai: data.cai,
    rango_factura_desde: data.rango_factura_desde,
    rango_factura_hasta: data.rango_factura_hasta,
    fecha_limite_emision: data.fecha_limite_emision,

    proveedor_id: proveedorId
  };

  // 3️⃣ Actualizar sucursal (aislada, sin cascadas)
  const actualizado = await repo.update(
    proveedorId,
    sucursalId,
    payload
  );

  // 4️⃣ Registrar bitácora
  await bitacora.registrar(
    {
      usuario_id: req.usuario.id,
      empresa_id: req.empresa_id
    },
    {
      modulo: "proveedor_sucursales",
      accion: "UPDATE",
      descripcion: `Actualizó la sucursal ${anterior.nombre}`,
      data_anterior: anterior,
      data_nueva: actualizado
    }
  );

  return actualizado;
}


module.exports = {
  listByProveedor,
  create,
  getById,
  update
};
