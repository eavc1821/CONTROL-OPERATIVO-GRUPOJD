import {
  findProveedorByRuc,
  createProveedor
} from "../repositories/proveedores.v2.repository.js";

import {
  existsCai,
  createSucursal
} from "../repositories/proveedorSucursales.v2.repository.js";

export async function crearProveedorOperativo(client, payload) {
  const { proveedor, sucursal } = payload;

  // 1. Validar CAI único
  const caiDuplicado = await existsCai(client, sucursal.cai);
  if (caiDuplicado) {
    const err = new Error("El CAI ya está registrado");
    err.status = 409;
    throw err;
  }

  // 2. Buscar proveedor por RTN
  let proveedorDb = await findProveedorByRuc(client, proveedor.ruc);

  // 3. Crear proveedor si no existe
  if (!proveedorDb) {
    proveedorDb = await createProveedor(client, proveedor);
  }

  // 4. Crear sucursal (siempre)
  const sucursalDb = await createSucursal(client, {
    proveedor_id: proveedorDb.id,
    ...sucursal
  });

  return {
    proveedor: proveedorDb,
    sucursal: sucursalDb
  };
}
