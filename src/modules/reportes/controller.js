const service = require('./service');

async function resumen(req, res, next) {
  try {
    const ctx = {
      empresaId: req.empresa_id,
      empresaIds: req.empresa_ids,
      modo: req.empresaModo || 'EMPRESA'
    };

    const data = await service.getResumen(ctx);
    res.json({ 
      ok: true, 
      data,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) { next(err); }
}

async function totalesProveedor(req, res, next) {
  try {
    const data = await service.getPorProveedor(req.empresa_id);
    res.json({ 
      ok: true, 
      data,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) { next(err); }
}

async function totalesTipoPago(req, res, next) {
  try {
    const ctx = {
      empresaId: req.empresa_id,
      empresaIds: [],
      modo: req.empresaModo || 'EMPRESA'
    };

    const data = await service.getPorTipoPago(ctx);
    res.json({ 
      ok: true, 
      data,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) { next(err); }
}

async function mensual(req, res, next) {
  try {
    const ctx = {
      empresaId: req.empresa_id,
      empresaIds: req.empresa_ids,
      modo: req.empresaModo || 'EMPRESA'
    };

    const data = await service.getMensual(ctx);
    res.json({ 
      ok: true, 
      data,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) { next(err); }
}

async function ranking(req, res, next) {
  try {
    const ctx = {
      empresaId: req.empresa_id,
      empresaIds: req.empresa_ids,
      modo: req.empresaModo || 'EMPRESA'
    };

    const data = await service.getRanking(ctx);
    res.json({ 
      ok: true, 
      data,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) { next(err); }
}

async function resumenPorSolicitud(req, res, next) {
  try {
    const data = await service.getResumenPorSolicitud(req.empresa_id, req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ 
      ok: true, 
      data,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) { next(err); }
}

async function dashboard(req, res, next) {
  try {
    const ctx = {
      empresaId: req.empresa_id,
      empresaIds: req.empresa_ids,
      modo: req.empresaModo || (req.empresa_id === 0 ? 'GENERAL' : 'EMPRESA')
    };
    
    const data = await service.getDashboard(ctx);

    res.json({
      ok: true,
      data: {
        ...data,
        modo: ctx.modo
      },
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) {
    next(err);
  }
}


async function meses(req, res, next) {
  try {
    const ctx = {
      empresaId: req.empresa_id,
      empresaIds: req.empresa_ids,
      modo: req.empresaModo || 'EMPRESA'
    };

    const data = await service.getMesesDisponibles(ctx);
    res.json({ 
      ok: true, 
      data,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) { next(err); }
}

async function dashboardPorMes(req, res, next) {
  try {
    const periodo = req.params.periodo;
    const ctx = {
      empresaId: req.empresa_id,
      empresaIds: req.empresa_ids,
      modo: req.empresaModo || (req.empresa_id === 0 ? 'GENERAL' : 'EMPRESA')
    };

    const data = await service.getDashboardPorMes(ctx, periodo);
    res.json({ 
      ok: true,
      data,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) { next(err); }
}

async function proveedoresReporte(req, res) {
  try {
    const empresaId = req.empresa_id;

    const filtros = {
      mes: req.query.mes || null,
      categoria: req.query.categoria || null,
    };

    const ctx = {
    empresaId: req.empresa_id,
    empresaIds: req.empresa_ids,
    modo: req.empresaModo || 'EMPRESA',
    filtros: {
      mes: req.query.mes || null,
      categoria: req.query.categoria || null
    }
  };

  const data = await service.getProveedoresReporte(ctx);


    return res.json({ 
      ok: true, 
      data,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener el reporte de proveedores",
    });
  }
}


async function proveedorPerfil(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: 'ID de proveedor inválido'
      });
    }

    const data = await service.getProveedorPerfil(req.empresa_id, id);
    res.json({ 
      ok: true, 
      data,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) {
    next(err);
  }
}

async function exportDetallePDF(req, res, next) {
  try {
    const ctx = {
      empresaId: req.empresa_id,
      empresaIds: req.empresa_ids,
      modo: req.empresaModo || 'EMPRESA',
      filtros: req.body
    };

    const pdfBuffer = await service.exportDetallePDF(ctx);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=reporte_solicitudes.pdf"
    );

    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}


module.exports = {
  resumen,
  totalesProveedor,
  totalesTipoPago,
  mensual,
  ranking,
  resumenPorSolicitud,
  dashboard,
  meses,
  dashboardPorMes,
  proveedoresReporte,
  proveedorPerfil,
  exportDetallePDF
};
