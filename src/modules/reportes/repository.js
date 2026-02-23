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

async function getMensual(empresaId, empresaIds = [], limit = 6) {
  const { rows } = await pool.query(`
    SELECT
      v.periodo,
      v.empresa_id,
      e.nombre AS empresa,
      v.total_solicitud,
      COALESCE(SUM(p.monto), 0) AS total_pagado,
      v.total_solicitud - COALESCE(SUM(p.monto), 0) AS saldo
    FROM vw_totales_mensuales v
    JOIN empresas e ON e.id = v.empresa_id
    LEFT JOIN pagos p
      ON p.empresa_id = v.empresa_id
     AND DATE_TRUNC('month', p.fecha_pago) = v.periodo
    WHERE (
      $1 = 0
      OR v.empresa_id = ANY($2)
    )
    GROUP BY
      v.periodo,
      v.empresa_id,
      e.nombre,
      v.total_solicitud
    ORDER BY v.periodo DESC
    LIMIT $3;
  `, [empresaId, empresaIds, limit]);

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
    SELECT periodo, nombre
    FROM vw_meses_disponibles_fmt
    WHERE ($1 = 0 OR empresa_id = $1)
    ORDER BY periodo DESC
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

      v.total_solicitud,
      v.total_pagado,
      v.saldo_restante AS saldo,

      s.estado,
      s.fecha_solicitud,

      v.numero_factura,
      v.fecha_factura,

      cf.banco,
      cf.numero_cuenta

    FROM vw_total_pagado_por_solicitud v

    JOIN solicitudes s
      ON s.id = v.solicitud_id

    JOIN proveedores p
      ON p.id = v.proveedor_id

    LEFT JOIN LATERAL (
      SELECT pa.cuenta_financiera_id
      FROM pagos pa
      WHERE pa.solicitud_id = s.id
        AND pa.empresa_id   = s.empresa_id
      ORDER BY pa.fecha_pago DESC, pa.created_at DESC
      LIMIT 1
    ) ultimo_pago ON true

    LEFT JOIN cuentas_financieras cf
      ON cf.id = ultimo_pago.cuenta_financiera_id

    WHERE ($1 = 0 OR v.empresa_id = $1)
      AND date_trunc('month', s.fecha_solicitud)
          = to_date($2 || '-01', 'YYYY-MM-DD')

    ORDER BY s.fecha_solicitud DESC;
  `, [empresaId, periodo]);

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
    p.fecha_limite_emision,
    p.rango_factura_desde,
    p.rango_factura_hasta,         
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
        s.id AS solicitud_id,
        s.correlativo,
        p.nombre AS proveedor,
        s.tipo_pago,
        s.estado,
        s.fecha_solicitud,

        v.total_solicitud,
        v.total_pagado,
        v.saldo_restante AS saldo,

        pa.id AS pago_id,
        pa.monto,
        pa.fecha_pago,
        pa.numero_factura,
        pa.fecha_factura,
        pa.factura_url,

        cf.banco,
        cf.numero_cuenta,
        cf.nombre AS cuenta_nombre

      FROM solicitudes s

      JOIN proveedores p 
        ON p.id = s.proveedor_id

      JOIN vw_total_pagado_por_solicitud v 
        ON v.solicitud_id = s.id
      AND v.empresa_id   = s.empresa_id

      LEFT JOIN LATERAL (
        SELECT
          pa.id,
          pa.monto,
          pa.fecha_pago,
          pa.numero_factura,
          pa.fecha_factura,
          pa.factura_url,
          pa.cuenta_financiera_id
        FROM pagos pa
        WHERE pa.solicitud_id = s.id
          AND pa.empresa_id   = s.empresa_id
        ORDER BY pa.fecha_pago DESC, pa.created_at DESC
        LIMIT 1
      ) pa ON true

      LEFT JOIN cuentas_financieras cf
        ON cf.id = pa.cuenta_financiera_id

      WHERE s.proveedor_id = $1
        AND ($2 = 0 OR s.empresa_id = $2)

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

      e.id AS empresa_id,
      e.nombre AS empresa_nombre,

      v.numero_factura,
      v.fecha_factura,

      cf.banco,
      cf.numero_cuenta,
      cf.nombre AS cuenta_nombre

    FROM vw_total_pagado_por_solicitud v

    JOIN solicitudes s
      ON s.id = v.solicitud_id

    JOIN proveedores p
      ON p.id = v.proveedor_id

    JOIN empresas e
      ON e.id = v.empresa_id

    LEFT JOIN LATERAL (
        SELECT
          pa.cuenta_financiera_id
        FROM pagos pa
        WHERE pa.solicitud_id = s.id
          AND pa.empresa_id   = s.empresa_id
        ORDER BY pa.fecha_pago DESC, pa.created_at DESC
        LIMIT 1
      ) ultimo_pago ON true

      LEFT JOIN cuentas_financieras cf
        ON cf.id = ultimo_pago.cuenta_financiera_id

    WHERE (
      $1 = 0
      OR v.empresa_id = ANY($2)
    )

    ORDER BY s.fecha_solicitud DESC
    LIMIT 10;
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


async function getReporteRango({
  empresaId,
  empresaIds = [],
  desde,
  hasta,
  estado,
  proveedor
}) {

  if (!desde || !hasta) {
    throw new Error("Rango de fechas requerido");
  }

  // ======================================
  // BUILD WHERE DINÁMICO (UNA SOLA VEZ)
  // ======================================

  const params = [];
  let idx = 1;

  const where = [];

  // Empresa
  if (empresaId === 0) {
    where.push(`v.empresa_id = ANY($${idx++})`);
    params.push(empresaIds);
  } else {
    where.push(`v.empresa_id = $${idx++}`);
    params.push(empresaId);
  }

  // Fechas
  where.push(`s.fecha_solicitud BETWEEN $${idx} AND $${idx + 1}`);
  params.push(desde, hasta);
  idx += 2;

  // Estado (opcional)
  if (estado && estado !== "Todos") {
    where.push(`LOWER(s.estado) = LOWER($${idx++})`);
    params.push(estado);
  }

  // Proveedor (opcional)
  if (proveedor && proveedor !== "Todos") {
    where.push(`p.nombre = $${idx++}`);
    params.push(proveedor);
  }

  const whereSQL = where.join(" AND ");

  // ======================================
  // 1️⃣ KPIs
  // ======================================

  const kpiQuery = `
    SELECT
      COALESCE(SUM(v.total_solicitud),0) AS total_solicitado,
      COALESCE(SUM(v.total_pagado),0) AS total_pagado,
      COALESCE(SUM(v.saldo_restante),0) AS saldo_pendiente,
      COUNT(*) AS total_solicitudes
    FROM vw_total_pagado_por_solicitud v
    JOIN solicitudes s ON s.id = v.solicitud_id
    JOIN proveedores p ON p.id = v.proveedor_id
    WHERE ${whereSQL};
  `;

  const { rows: kpiRows } = await pool.query(kpiQuery, params);

  const kpisRaw = kpiRows[0] || {};

  const kpis = {
    total_solicitado: Number(kpisRaw.total_solicitado || 0),
    total_pagado: Number(kpisRaw.total_pagado || 0),
    saldo_pendiente: Number(kpisRaw.saldo_pendiente || 0),
    total_solicitudes: Number(kpisRaw.total_solicitudes || 0),
  };

  // ======================================
  // 2️⃣ DETALLE
  // ======================================

  const detalleQuery = `
    SELECT
      s.correlativo,
      p.nombre AS proveedor,
      s.tipo_pago,
      s.estado,
      s.fecha_solicitud,
      v.total_solicitud,
      v.total_pagado,
      v.saldo_restante AS saldo,
      v.numero_factura,
      v.fecha_factura,
      cf.banco,
      cf.numero_cuenta
    FROM vw_total_pagado_por_solicitud v
    JOIN solicitudes s ON s.id = v.solicitud_id
    JOIN proveedores p ON p.id = v.proveedor_id
    LEFT JOIN LATERAL (
      SELECT pa.cuenta_financiera_id
      FROM pagos pa
      WHERE pa.solicitud_id = s.id
        AND pa.empresa_id = s.empresa_id
      ORDER BY pa.fecha_pago DESC, pa.created_at DESC
      LIMIT 1
    ) ultimo_pago ON true
    LEFT JOIN cuentas_financieras cf
      ON cf.id = ultimo_pago.cuenta_financiera_id
    WHERE ${whereSQL}
    ORDER BY s.fecha_solicitud DESC;
  `;

  const { rows: detalle } = await pool.query(detalleQuery, params);

  // ======================================
  // 3️⃣ TOP PROVEEDORES
  // ======================================

  const providersQuery = `
    SELECT
      p.nombre AS proveedor,
      SUM(v.total_solicitud) AS total_compras
    FROM vw_total_pagado_por_solicitud v
    JOIN proveedores p ON p.id = v.proveedor_id
    JOIN solicitudes s ON s.id = v.solicitud_id
    WHERE ${whereSQL}
    GROUP BY p.nombre
    ORDER BY total_compras DESC
    LIMIT 10;
  `;

  const { rows: providers } = await pool.query(providersQuery, params);

  // ======================================
  // 4️⃣ TIPO PAGO
  // ======================================

  const tipoPagoQuery = `
    SELECT
      s.tipo_pago,
      SUM(v.total_solicitud) AS total_solicitado,
      SUM(v.total_pagado) AS total_pagado
    FROM vw_total_pagado_por_solicitud v
    JOIN solicitudes s ON s.id = v.solicitud_id
    JOIN proveedores p ON p.id = v.proveedor_id
    WHERE ${whereSQL}
    GROUP BY s.tipo_pago
    ORDER BY s.tipo_pago;
  `;

  const { rows: paymentTypes } = await pool.query(tipoPagoQuery, params);

  // ======================================
  // 5️⃣ ESTADOS
  // ======================================

  const stateQuery = `
    SELECT
      s.estado,
      COUNT(*) AS cnt
    FROM vw_total_pagado_por_solicitud v
    JOIN solicitudes s ON s.id = v.solicitud_id
    JOIN proveedores p ON p.id = v.proveedor_id
    WHERE ${whereSQL}
    GROUP BY s.estado;
  `;

  const { rows: states } = await pool.query(stateQuery, params);

  // ======================================
  // 6️⃣ CASHFLOW
  // ======================================

  const cashflowQuery = `
    SELECT
      s.fecha_solicitud AS fecha,
      SUM(v.total_solicitud) AS total_solicitud,
      SUM(v.total_pagado) AS total_pagado
    FROM vw_total_pagado_por_solicitud v
    JOIN solicitudes s ON s.id = v.solicitud_id
    JOIN proveedores p ON p.id = v.proveedor_id
    WHERE ${whereSQL}
    GROUP BY s.fecha_solicitud
    ORDER BY s.fecha_solicitud;
  `;

  const { rows: cashflow } = await pool.query(cashflowQuery, params);

  return {
    kpis,
    providers,
    paymentTypes,
    states,
    cashflow,
    detalle
  };
}


async function getReporteSolicitudesCompleto({
  empresaId,
  empresaIds,
  filtros
}) {
  const params = [];
  const where = [];

  // =========================
  // FILTRO EMPRESA (CLAVE)
  // =========================
  if (empresaId === 0) {
    // modo admin / general → sin filtro
  } else if (Array.isArray(empresaIds) && empresaIds.length > 0) {
    params.push(empresaIds);
    where.push(`v.empresa_id = ANY($${params.length})`);
  } else {
    params.push(empresaId);
    where.push(`v.empresa_id = $${params.length}`);
  }

  // =========================
  // FILTRO ESTADO
  // =========================
  if (filtros?.estado && filtros.estado !== "Todos") {
    params.push(filtros.estado);
    where.push(`LOWER(s.estado) = LOWER($${params.length})`);
  }

  // =========================
  //VALIDACION DE FILTRO PERIODO (YYYY-MM)
  // =========================

  if (filtros?.periodo && /^\d{4}-\d{2}$/.test(filtros.periodo)) {
    params.push(filtros.periodo);
    where.push(`
      date_trunc('month', s.fecha_solicitud)
      = to_date($${params.length} || '-01', 'YYYY-MM-DD')
  `);
}


  // =========================
  // FILTRO PERIODO (YYYY-MM)
  // =========================
  // if (filtros?.periodo) {
  //   params.push(filtros.periodo);
  //   where.push(`
  //     date_trunc('month', s.fecha_solicitud)
  //     = to_date($${params.length} || '-01', 'YYYY-MM-DD')
  //   `);
  // }

  // =========================
  // SQL FINAL
  // =========================
  const sql = `
    SELECT
      s.correlativo,
      p.nombre AS proveedor,
      s.tipo_pago,
      s.estado,
      s.fecha_solicitud,

      v.total_solicitud,
      v.total_pagado,
      v.saldo_restante AS saldo,

      v.numero_factura,
      v.fecha_factura,

      cf.banco,
      cf.numero_cuenta

    FROM vw_total_pagado_por_solicitud v
    JOIN solicitudes s ON s.id = v.solicitud_id
    JOIN proveedores p ON p.id = v.proveedor_id
    LEFT JOIN LATERAL (
      SELECT cuenta_financiera_id
      FROM pagos
      WHERE solicitud_id = s.id
        AND empresa_id = s.empresa_id
      ORDER BY fecha_pago DESC, created_at DESC
      LIMIT 1
    ) pa ON true
    LEFT JOIN cuentas_financieras cf
      ON cf.id = pa.cuenta_financiera_id

    WHERE ${where.length ? where.join(" AND ") : "TRUE"}
    ORDER BY s.fecha_solicitud DESC;
  `;

  const { rows } = await pool.query(sql, params);
  return rows;
}


async function getEmpresaNombre(empresaId) {
  const { rows } = await pool.query(
    `SELECT nombre FROM empresas WHERE id = $1`,
    [empresaId]
  );

  return rows[0]?.nombre || "Empresa";
}


const QueryStream = require("pg-query-stream");
const db = require("../../core/db"); // ajusta si tu path cambia

async function getReporteRangoStream(params) {

  const client = await db.connect();

  const query = `
    SELECT
      correlativo,
      proveedor,
      fecha_solicitud,
      fecha_factura,
      numero_factura,
      tipo_pago,
      banco,
      numero_cuenta,
      total_solicitud,
      total_pagado,
      saldo,
      estado
    FROM vw_reporte_rango
    WHERE empresa_id = $1
      AND fecha_solicitud BETWEEN $2 AND $3
      AND ($4 = 'Todos' OR estado = $4)
      AND ($5 = 'Todos' OR proveedor = $5)
    ORDER BY fecha_solicitud DESC
  `;

  const stream = client.query(
    new QueryStream(query, [
      params.empresaId,
      params.desde,
      params.hasta,
      params.estado || "Todos",
      params.proveedor || "Todos"
    ])
  );

  stream.on("end", () => client.release());
  stream.on("error", () => client.release());

  return stream;
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
  getResumenPorEmpresa,
  getReporteRango,
  getReporteSolicitudesCompleto,
  getEmpresaNombre,
  getReporteRangoStream
};
