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

module.exports = {
  crearProveedorV2
};
