const pool = require("../../../core/db.js");
const {
  crearProveedorOperativo
} = require("../services/proveedores.v2.service");

async function crearProveedorV2(req, res, next) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await crearProveedorOperativo(client, req.body);

    await client.query("COMMIT");
    res.status(201).json(result);

  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

// controllers/proveedores.controller.js
export async function listarProveedoresV2(req, res) {
  const { rows } = await pool.query(`
    SELECT
      p.id,
      p.nombre,
      p.ruc,
      p.contacto,
      p.correo,
      p.direccion,
      p.categoria_id,
      COALESCE(
        json_agg(
          json_build_object(
            'id', ps.id,
            'nombre', ps.nombre,
            'contacto', ps.contacto,
            'correo', ps.correo,
            'direccion', ps.direccion,
            'cai', ps.cai,
            'fecha_limite_emision', ps.fecha_limite_emision,
            'rango_factura_desde', ps.rango_factura_desde,
            'rango_factura_hasta', ps.rango_factura_hasta
          )
        ) FILTER (WHERE ps.id IS NOT NULL),
        '[]'
      ) AS sucursales
    FROM proveedores p
    LEFT JOIN proveedor_sucursales ps
      ON ps.proveedor_id = p.id
    GROUP BY p.id
    ORDER BY p.nombre ASC
  `);

  res.json({ data: rows });
}

export async function listarProveedoresListado(req, res) {
  const { rows } = await pool.query(`
    SELECT
      ps.id,
      p.id AS proveedor_id,
      p.nombre AS proveedor_nombre,
      p.ruc AS proveedor_ruc,
      ps.nombre AS sucursal_nombre,
      ps.contacto,
      ps.correo,
      ps.direccion,
      ps.cai,
      ps.fecha_limite_emision,
      ps.rango_factura_desde,
      ps.rango_factura_hasta
    FROM proveedor_sucursales ps
    JOIN proveedores p ON p.id = ps.proveedor_id
    ORDER BY p.nombre, ps.nombre
  `);

  res.json({ data: rows });
}



module.exports = {
  crearProveedorV2,
  listarProveedoresV2,
  listarProveedoresListado
};
