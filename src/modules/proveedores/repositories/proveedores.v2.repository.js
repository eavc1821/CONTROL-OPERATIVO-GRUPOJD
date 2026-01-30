async function findProveedorByRuc(client, ruc) {
  const { rows } = await client.query(
    "SELECT * FROM proveedores WHERE ruc = $1",
    [ruc]
  );
  return rows[0] || null;
}

async function createProveedor(client, data) {
  const { rows } = await client.query(
    `
    INSERT INTO proveedores
      (nombre, ruc, contacto, correo, direccion, categoria_id)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
    `,
    [
      data.nombre,
      data.ruc,
      data.contacto,
      data.correo,
      data.direccion,
      data.categoria_id
    ]
  );
  return rows[0];
}

module.exports = {
  findProveedorByRuc,
  createProveedor
};
