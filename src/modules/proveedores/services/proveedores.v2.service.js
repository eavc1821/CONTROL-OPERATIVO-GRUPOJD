const {
  findProveedorByRuc,
  createProveedor
} = require("../repositories/proveedores.v2.repository");

const {
  existsCai,
  createSucursal
} = require("../repositories/proveedorSucursales.v2.repository");

async function crearProveedorOperativo(client, payload) {
  const { proveedor, sucursal } = payload;

  const caiDuplicado = await existsCai(client, sucursal.cai);
  if (caiDuplicado) {
    const err = new Error("El CAI ya está registrado");
    err.status = 409;
    throw err;
  }

  let proveedorDb = await findProveedorByRuc(client, proveedor.ruc);

  if (!proveedorDb) {
    proveedorDb = await createProveedor(client, proveedor);
  }

  const sucursalDb = await createSucursal(client, {
    proveedor_id: proveedorDb.id,
    ...sucursal
  });

  return { proveedor: proveedorDb, sucursal: sucursalDb };
}

module.exports = {
  crearProveedorOperativo
};
