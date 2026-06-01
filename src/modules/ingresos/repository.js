const pool = require("../../core/db");

async function createIngresoTx(client, data) {
  const q = `
    INSERT INTO ingresos (
      empresa_id,
      correlativo,
      tipo_ingreso
    )
    VALUES ($1, $2, 'TRANSPORTE')
    RETURNING *
  `;

  const { rows } = await client.query(q, [
    data.empresa_id,
    data.correlativo,
  ]);

  return rows[0];
}


async function getNextNumeroViajeTx(client, empresaId) {
  const q = `
    SELECT COALESCE(MAX(it.numero_viaje), 0) + 1 AS next_viaje
    FROM ingresos_transporte it
    JOIN ingresos i ON i.id = it.ingreso_id
    WHERE i.empresa_id = $1
  `;

  const { rows } = await client.query(q, [empresaId]);
  return Number(rows[0].next_viaje);
}


async function createIngresoDetalleTx(client, data) {
  const q = `
    INSERT INTO ingresos_transporte (
      ingreso_id,
      fecha_hora_descarga,
      cliente_id,
      operador_id,
      cisterna_id,
      numero_viaje,
      viaticos,
      depreciacion,
      g_admin
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `;

  const { rows } = await client.query(q, [
    data.ingreso_id,
    data.fecha_hora_descarga,
    data.cliente_id,
    data.operador_id,
    data.cisterna_id,
    data.numero_viaje,
    data.viaticos ?? 3500,
    2500,
    1680,
  ]);

  return rows[0];
}

async function getIngresosPaginated({
  empresaId,
  page = 1,
  limit = 10,
  search = "",
  desde = "",
  hasta = "",
  cliente = "",
}) {
  const offset = (page - 1) * limit;

  const filters = [`i.empresa_id = $1`];
  const values = [empresaId];
  let idx = 2;

  if (desde) {
  filters.push(`DATE(it.fecha_hora_descarga) >= $${idx}`);
  values.push(desde);
  idx++;
}

if (hasta) {
  filters.push(`DATE(it.fecha_hora_descarga) <= $${idx}`);
  values.push(hasta);
  idx++;
}

  if (cliente) {
  filters.push(`it.cliente_id = $${idx}`);
  values.push(cliente);
  idx++;
}

  if (search) {
    filters.push(`i.correlativo ILIKE $${idx}`);
    values.push(`%${search}%`);
    idx++;
  }

  const where = filters.join(" AND ");

  const dataQuery = `
    SELECT
      i.id,
      i.correlativo,
      it.fecha_hora_descarga,
      c.nombre AS cliente,
      o.nombre AS operador,
      ci.placa AS cisterna,
      it.numero_viaje,
      COALESCE(it.viaticos, 3500) AS viaticos,
      COALESCE(it.depreciacion, 2500) AS depreciacion,
      COALESCE(it.g_admin, 1680) AS g_admin
    FROM ingresos i
    JOIN ingresos_transporte it ON it.ingreso_id = i.id
    JOIN clientes_ingresos c ON c.id = it.cliente_id
    JOIN operadores_transporte o ON o.id = it.operador_id
    JOIN cisternas ci ON ci.id = it.cisterna_id
    WHERE ${where}
    ORDER BY it.fecha_hora_descarga DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM ingresos i
    JOIN ingresos_transporte it ON it.ingreso_id = i.id
    WHERE ${where}
  `;

  const dataValues = [...values, limit, offset];

  const [dataRes, countRes] = await Promise.all([
    pool.query(dataQuery, dataValues),
    pool.query(countQuery, values),
  ]);

  return {
    data: dataRes.rows,
    total: countRes.rows[0].total,
  };
}


async function getNextCorrelativoTx(client) {
  const q = `
    SELECT COUNT(*)::int + 1 AS next_number
    FROM ingresos
    WHERE tipo_ingreso = 'TRANSPORTE'
  `;

  const { rows } = await client.query(q);
  return String(rows[0].next_number).padStart(7, "0");
}

module.exports = {
    createIngresoTx,
    getNextNumeroViajeTx,
    createIngresoDetalleTx,
    getIngresosPaginated,
    getNextCorrelativoTx
};
