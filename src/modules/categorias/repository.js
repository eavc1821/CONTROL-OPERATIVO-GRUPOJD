const pool = require("../../core/db");

async function findAll() {
  const { rows } = await pool.query(`
    SELECT id, nombre, created_at
    FROM categorias
    ORDER BY nombre
  `);
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `
    SELECT id, nombre, created_at
    FROM categorias
    WHERE id = $1
    `,
    [id]
  );
  return rows[0];
}

async function create(data) {
  const { nombre } = data;

  const { rows } = await pool.query(
    `
    INSERT INTO categorias (nombre, created_at)
    VALUES ($1, NOW())
    RETURNING *
    `,
    [nombre]
  );

  return rows[0];
}

async function update(id, data) {
  const { nombre } = data;

  const { rows } = await pool.query(
    `
    UPDATE categorias
    SET nombre = $1
    WHERE id = $2
    RETURNING *
    `,
    [nombre, id]
  );

  return rows[0];
}

async function remove(id) {
  await pool.query(
    `DELETE FROM categorias WHERE id = $1`,
    [id]
  );
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};
