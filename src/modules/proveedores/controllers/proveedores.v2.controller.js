import pool from "../../../core/db.js";
import { crearProveedorOperativo } from "../services/proveedores.v2.service.js";

export async function crearProveedorV2(req, res) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await crearProveedorOperativo(client, req.body);

    await client.query("COMMIT");
    res.status(201).json(result);

  } catch (err) {
    await client.query("ROLLBACK");

    res.status(err.status || 500).json({
      message: err.message || "Error interno"
    });
  } finally {
    client.release();
  }
}
