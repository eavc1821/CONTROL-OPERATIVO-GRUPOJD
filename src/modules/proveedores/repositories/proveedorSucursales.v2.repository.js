export async function existsCai(client, cai) {
  const { rowCount } = await client.query(
    `SELECT 1 FROM proveedor_sucursales WHERE cai = $1`,
    [cai]
  );
  return rowCount > 0;
}

export async function createSucursal(client, data) {
  const { rows } = await client.query(
    `
    INSERT INTO proveedor_sucursales (
      proveedor_id,
      nombre,
      cai,
      rango_factura_desde,
      rango_factura_hasta,
      fecha_limite_emision,
      contacto,
      correo,
      direccion
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
    `,
    [
      data.proveedor_id,
      data.nombre,
      data.cai,
      data.rango_factura_desde,
      data.rango_factura_hasta,
      data.fecha_limite_emision,
      data.contacto,
      data.correo,
      data.direccion
    ]
  );
  return rows[0];
}
