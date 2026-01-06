const db = require("../../core/db");

async function insert(data) {
  const {
    usuario_id,
    empresa_id,
    modulo,
    accion,
    descripcion,
    data_anterior,
    data_nueva,
    ip,
    user_agent
  } = data;

  const { rows } = await db.query(
    `
    INSERT INTO bitacora (
      usuario_id,
      empresa_id,
      modulo,
      accion,
      descripcion,
      data_anterior,
      data_nueva,
      ip,
      user_agent
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING id
    `,
    [
      usuario_id,
      empresa_id || null,
      modulo,
      accion,
      descripcion,
      data_anterior || null,
      data_nueva || null,
      ip || null,
      user_agent || null
    ]
  );

  return rows[0];
}

async function list({ modulo, accion, empresa_id }) {
  const conditions = [];
  const values = [];

  if (empresa_id) {
    values.push(empresa_id);
    conditions.push(`(b.empresa_id = $${values.length} OR b.empresa_id IS NULL)`);
  }

  if (modulo) {
    values.push(modulo);
    conditions.push(`b.modulo = $${values.length}`);
  }

  if (accion) {
    values.push(accion);
    conditions.push(`b.accion = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await db.query(
    `
    SELECT
      b.id,
      b.modulo,
      b.accion,
      b.descripcion,
      b.created_at,
      u.nombre AS usuario
    FROM bitacora b
    LEFT JOIN usuarios u ON u.id = b.usuario_id
    ${where}
    ORDER BY b.created_at DESC
    LIMIT 200
    `,
    values
  );

  return rows;
}



module.exports = { insert, list };


