const pool = require('../../core/db');

async function getResumen(empresaId) {
  const { rows } = await pool.query(`
    SELECT *
    FROM vw_resumen_solicitud
    WHERE ($1 = 0 OR empresa_id = $1)
    AND estado IN ('aprobada', 'pagada')
    ORDER BY solicitud_id DESC
  `, [empresaId]);
  return rows;
}


async function getPorProveedor(empresaId, empresaIds = []) {
  const { rows } = await pool.query(`
    SELECT
      p.nombre AS proveedor,
      SUM(s.total) AS total_compras
    FROM solicitudes s
    JOIN proveedores p ON p.id = s.proveedor_id
    WHERE s.estado IN ('aprobada', 'pagada')
  AND (
    $1 = 0
    OR s.empresa_id = ANY($2)
  )
    GROUP BY p.nombre
    ORDER BY total_compras DESC
    LIMIT 10;
  `, [empresaId, empresaIds]);

  return rows;
}


async function getPorTipoPago(empresaId) {
  const { rows } = await pool.query(`SELECT * FROM vw_totales_por_tipo_pago WHERE ($1 = 0 OR empresa_id = $1)
`, [empresaId]);
  return rows;
}

async function getMensual(empresaId, empresaIds = []) {
  const { rows } = await pool.query(`
    SELECT * FROM vw_totales_mensuales
    WHERE (
      $1 = 0
      OR empresa_id = ANY($2)
    )
  `, [empresaId, empresaIds]);
  return rows;
}

async function getRanking(empresaId, empresaIds = []) {
  const { rows } = await pool.query(`
    SELECT
      p.nombre AS proveedor,
      SUM(v.total_pagado) AS total_pagado
    FROM vw_total_pagado_por_solicitud v
    JOIN proveedores p ON p.id = v.proveedor_id
    WHERE (
      $1 = 0
      OR v.empresa_id = ANY($2)
    )
    GROUP BY p.nombre
    ORDER BY total_pagado DESC
    LIMIT 10;
  `, [empresaId, empresaIds]);
  return rows;
}


async function getResumenPorSolicitud(id, empresaId) {
  const { rows } = await pool.query('SELECT * FROM vw_resumen_solicitud WHERE solicitud_id = $1 AND empresa_id = $2', [id, empresaId]);
  return rows[0];
}

async function getTotalesPorTipoPago(empresaId) {
  const { rows } = await pool.query(`
    SELECT * FROM vw_totales_por_tipo_pago
    WHERE ($1 = 0 OR empresa_id = $1)

    ORDER BY tipo_pago;
  `, [empresaId]);
  return rows;
}

async function getCashflow(empresaId, empresaIds = []) {
  const { rows } = await pool.query(`
    SELECT
      fecha,
      total_solicitud,
      total_pagado
    FROM vw_cashflow_diario
    WHERE ($1 = 0 OR empresa_id = ANY($2))
    ORDER BY fecha;
  `, [empresaId, empresaIds]);

  return rows;
}




async function getMesesDisponibles(empresaId) {
  const { rows } = await pool.query(`
    SELECT DISTINCT 
      TO_CHAR(fecha_solicitud, 'YYYY-MM') AS periodo,
      TO_CHAR(fecha_solicitud, 'TMMonth YYYY') AS nombre
    FROM solicitudes
    WHERE ($1 = 0 OR empresa_id = $1)
 
    ORDER BY periodo DESC;
  `, [empresaId]);
  return rows;
}

async function getDashboardPorMes(empresaId, periodo) {
  const { rows } = await pool.query(`
    SELECT
      v.solicitud_id,
      s.correlativo,
      p.nombre AS proveedor,
      s.tipo_pago,
      v.total_solicitud AS total,
      v.total_pagado AS pagado,
      v.saldo_restante AS saldo,
      s.estado,
      TO_CHAR(s.fecha_solicitud, 'DD/MM/YYYY') AS fecha_solicitud
    FROM vw_total_pagado_por_solicitud v
    JOIN solicitudes s ON s.id = v.solicitud_id
    JOIN proveedores p ON p.id = v.proveedor_id
    WHERE ($1 = 0 OR v.empresa_id = $1)
      AND TO_CHAR(s.fecha_solicitud, 'YYYY-MM') = $2
    ORDER BY s.fecha_solicitud DESC;
  `, [empresaId, periodo]);
console.log("📦 [repository.getDashboardPorMes] rows:", rows);
  return rows;
}


async function getProveedoresReporte({ empresaId, empresaIds, filtros }) {
  if (!Array.isArray(empresaIds)) {
    throw new Error('empresaIds inválido en repository');
  }

  const params = [empresaId, empresaIds];
const filters = [
  `( $1 = 0 OR v.empresa_id = ANY($2) )`
];


  if (filtros.mes) {
  params.push(filtros.mes);
  filters.push(`TO_CHAR(v.fecha_solicitud, 'YYYY-MM') = $${params.length}`);
}

if (filtros.categoria && filtros.categoria !== 'Todas') {
  params.push(filtros.categoria);
  filters.push(`c.nombre = $${params.length}`);
}

  const where = `WHERE ${filters.join(" AND ")}`;

  const sql = `
     SELECT
      p.id,
      p.nombre AS proveedor,
      c.nombre AS categoria,                 
      SUM(v.total_pagado) AS total_pagado,
      COUNT(*) AS solicitudes_pagadas,
      TO_CHAR(MAX(v.fecha_solicitud), 'DD/MM/YYYY') AS ultimo_pago
    FROM vw_total_pagado_por_solicitud v
    JOIN proveedores p ON p.id = v.proveedor_id
    LEFT JOIN categorias c ON c.id = p.categoria_id   
    ${where}
    GROUP BY p.id, p.nombre, c.nombre
    ORDER BY total_pagado DESC;
  `;

  const { rows } = await pool.query(sql, params);
  return rows;
}




async function getTotalPagadoDelMes(empresaId, mes) {
  const { rows } = await pool.query(`
    SELECT COALESCE(SUM(total_pagado), 0) AS total
    FROM vw_totales_mensuales
    WHERE ($1 = 0 OR empresa_id = $1)
      AND TO_CHAR(periodo, 'YYYY-MM') = $2
  `, [empresaId, mes]);

  return Number(rows[0].total || 0);
}



async function getProveedorPerfil(proveedorId, empresaId) {

  // 1️⃣ DATOS DEL PROVEEDOR
  const proveedorQuery = `
   SELECT
    p.id,
    p.nombre,
    p.ruc,
    p.cai,              
    p.contacto,
    p.correo,
    p.direccion,
    p.created_at,
    c.nombre AS categoria
  FROM proveedores p
  LEFT JOIN categorias c
    ON c.id = p.categoria_id
  WHERE p.id = $1;

  `;

  const proveedorResult = await pool.query(proveedorQuery, [proveedorId]);
  const proveedor = proveedorResult.rows[0] || {};

  // 2️⃣ KPIs DEL PROVEEDOR
  const kpiQuery = `
    SELECT
      COUNT(v.solicitud_id) AS total_solicitudes,
      COALESCE(SUM(v.total_solicitud), 0) AS total_solicitado,
      COALESCE(SUM(v.total_pagado), 0) AS total_pagado,
      COALESCE(SUM(v.saldo_restante), 0) AS saldo_pendiente,
      MAX(v.fecha_solicitud) AS ultimo_pago
    FROM vw_total_pagado_por_solicitud v
    JOIN solicitudes s ON s.id = v.solicitud_id
    WHERE s.proveedor_id = $1
      AND ($2 = 0 OR v.empresa_id = $2);
  `;

  const kpiResult = await pool.query(kpiQuery, [proveedorId, empresaId]);
  const kpis = kpiResult.rows[0] || {};

  // 3️⃣ DETALLE DE SOLICITUDES
  const detalleQuery = `
    SELECT
      v.solicitud_id,
      s.correlativo,
      p.nombre AS proveedor,
      s.tipo_pago,
      v.total_solicitud,
      v.total_pagado,
      v.saldo_restante AS saldo,
      s.estado,
      s.fecha_solicitud,
      s.fecha_factura,
      s.numero_factura
    FROM vw_total_pagado_por_solicitud v
    JOIN solicitudes s ON s.id = v.solicitud_id
    JOIN proveedores p ON p.id = s.proveedor_id
    WHERE s.proveedor_id = $1
      AND ($2 = 0 OR v.empresa_id = $2)
    ORDER BY s.fecha_solicitud DESC;
  `;

  const detalleResult = await pool.query(detalleQuery, [proveedorId, empresaId]);

  return {
    proveedor,
    kpis: {
      total_solicitudes: Number(kpis.total_solicitudes || 0),
      total_solicitado: Number(kpis.total_solicitado || 0),
      total_pagado: Number(kpis.total_pagado || 0),
      saldo_pendiente: Number(kpis.saldo_pendiente || 0),
      ultimo_pago: kpis.ultimo_pago,
    },
    detalle: detalleResult.rows,
  };
}


async function getDashboardKPIs(empresaId, empresaIds = []) {
  const { rows } = await pool.query(`
    SELECT
      COALESCE(SUM(total_solicitud), 0) AS total_solicitado,
      COALESCE(SUM(total_pagado), 0) AS total_pagado,
      COALESCE(SUM(saldo_restante), 0) AS saldo_pendiente,
      COUNT(*) AS total_solicitudes
    FROM vw_total_pagado_por_solicitud
    WHERE ($1 = 0 OR empresa_id = ANY($2));
  `, [empresaId, empresaIds]);

  return {
    total_solicitado: Number(rows[0].total_solicitado),
    total_pagado: Number(rows[0].total_pagado),
    saldo_pendiente: Number(rows[0].saldo_pendiente),
    total_solicitudes: Number(rows[0].total_solicitudes),
  };
}

async function getDashboardDetalle(empresaId, empresaIds = []) {
  const { rows } = await pool.query(`
    SELECT
        v.solicitud_id,
        s.correlativo,
        p.nombre AS proveedor,
        s.tipo_pago,
        v.total_solicitud,
        v.total_pagado,
        v.saldo_restante AS saldo,
        s.estado,
        s.fecha_solicitud,
        s.numero_factura,
        s.fecha_factura
    FROM vw_total_pagado_por_solicitud v
    JOIN solicitudes s ON s.id = v.solicitud_id
    JOIN proveedores p ON p.id = v.proveedor_id
    WHERE (
      $1 = 0
      OR v.empresa_id = ANY($2)
    )
    ORDER BY s.fecha_solicitud DESC
  `, [empresaId, empresaIds]);
  return rows;
}

async function getResumenPorEmpresa(empresaIds = []) {
  const { rows } = await pool.query(`
    SELECT
      e.id AS empresa_id,
      e.nombre AS empresa,
      COALESCE(SUM(v.total_solicitud), 0) AS total_solicitado,
      COALESCE(SUM(v.total_pagado), 0) AS total_pagado,
      COALESCE(SUM(v.saldo_restante), 0) AS saldo_pendiente
    FROM empresas e
    LEFT JOIN vw_total_pagado_por_solicitud v
      ON v.empresa_id = e.id
    WHERE e.id = ANY($1)
    GROUP BY e.id, e.nombre
    ORDER BY total_pagado DESC;
  `, [empresaIds]);

  return rows;
}




module.exports = {
  getResumen,
  getPorProveedor,
  getPorTipoPago,
  getMensual,
  getRanking,
  getResumenPorSolicitud,
  getTotalesPorTipoPago,
  getCashflow,
  getMesesDisponibles,
  getDashboardPorMes,
  getProveedoresReporte,
  getTotalPagadoDelMes,
  getProveedorPerfil,
  getDashboardKPIs,
  getDashboardDetalle,
  getResumenPorEmpresa
};
