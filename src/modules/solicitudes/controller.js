const service = require("./service");
const { getPagoById } = require("./service");


function bloquearSiEmpresaPadre(req, res) {
  if (req.empresaTipo === "PADRE") {
    res.status(403).json({
      ok: false,
      message: "Las empresas padre solo pueden visualizar información agregada"
    });
    return true;
  }
  return false;
}


async function list(req, res, next) {
  try {
    const ctx = {
      empresaId: req.empresa_id,
      usuarioId: req.usuario?.id
      
    };

    const rows = await service.list(ctx, req.query);
    res.json({ 
      ok: true, 
      data: rows,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) {
    next(err);
  }
}

// CREAR SOLICITUD
async function create(req, res, next) {
  try {
    if (bloquearSiEmpresaPadre(req, res)) return;
    if (!req.usuario) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no autenticado"
      });
    }

    const ctx = {
      empresaId: req.empresa_id,
      usuarioId: req.usuario.id
    };

    const payload = {
      ...req.body,
      fecha_solicitud: req.body.fecha_solicitud || new Date()
    };

    const solicitud = await service.create(ctx, payload);

    res.status(201).json({ 
      ok: true, 
      data: solicitud,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) {
    console.error("[createSolicitud] error:", err);
    next(err);
  }
}


async function update(req, res, next) {
  try {
    if (bloquearSiEmpresaPadre(req, res)) return;
    const ctx = {
      empresaId: req.empresa_id,
      usuarioId: req.usuario?.id
    };

    const id = req.params.id;

    const updated = await service.update(ctx, id, req.body);

    res.json({ 
      ok: true,
      message: "Solicitud actualizada correctamente",
      data: updated,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) {
    console.error("[updateSolicitud] error:", err);
    next(err);
  }
}


async function getById(req, res, next) {
  try {
    const ctx = {
      empresaId: req.empresa_id,
      usuarioId: req.usuario?.id
    };

    const data = await service.getById(ctx, req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Solicitud no encontrada"
      });
    }

    data.archivo = data.archivo_url || null;

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


async function approveWithFile(req, res, next) {
  try {
    if (bloquearSiEmpresaPadre(req, res)) return;
    if (!req.usuario) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no autenticado"
      });
    }

    const ctx = {
      empresaId: req.empresa_id,
      usuarioId: req.usuario.id
    };

    const id = req.params.id;

    const payload = {
      comentario: req.body?.comentario || null,
      numero_factura: req.body?.numero_factura || null,
      fecha_factura: req.body?.fecha_factura || null
    };

    const file = req.file || null;

    const updated = await service.approveWithFile(ctx, id, payload, file);

    res.json({ ok: true, data: updated });
  } catch (err) {
    console.error("[approveWithFile] error:", err);
    next(err);
  }
}


async function rejectWithComment(req, res, next) {
  try {
    if (bloquearSiEmpresaPadre(req, res)) return;
    if (!req.usuario) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no autenticado"
      });
    }

    const ctx = {
      empresaId: req.empresa_id,
      usuarioId: req.usuario.id
    };

    const id = req.params.id;
    const { comentario } = req.body;

    const updated = await service.rejectWithComment(ctx, id, comentario);

    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
}


async function updateFactura(req, res, next) {
  try {
    if (bloquearSiEmpresaPadre(req, res)) return;
    const id = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "Debe adjuntar un archivo PDF"
      });
    }

    const file = req.file;

    const updated = await service.updateFactura(req.empresa_id, id, file);

    res.json({ ok: true, message: "Factura actualizada", data: updated });
  } catch (err) {
    console.error("[updateFactura] error:", err);
    next(err);
  }
}

async function listPagos(req, res, next) {
  try {
    const ctx = {
      empresaId: req.empresa_id,
      usuarioId: req.usuario?.id
    };

    const solicitudId = req.params.id;

    const data = await service.listPagosBySolicitud(ctx, solicitudId);

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


async function registrarPago(req, res, next) {
  try {
    if (bloquearSiEmpresaPadre(req, res)) return;
    if (!req.usuario) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no autenticado"
      });
    }

    const ctx = {
      empresaId: req.empresa_id,
      usuarioId: req.usuario.id
    };

    const solicitudId = Number(req.params.id);

    const {
      monto,
      metodo_pago,
      fecha_pago,
      referencia,
      notas
    } = req.body;

    const file = req.file;

    // Validaciones manuales obligatorias (multipart)
    if (!monto || isNaN(monto) || Number(monto) <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El monto es obligatorio y debe ser mayor a 0"
      });
    }

    if (!metodo_pago) {
      return res.status(400).json({
        ok: false,
        message: "El método de pago es obligatorio"
      });
    }

    if (!file) {
      return res.status(400).json({
        ok: false,
        message: "Debe adjuntar la factura PDF del pago"
      });
    }

    const payload = {
      monto: Number(monto),
      metodo_pago,
      fecha_pago: fecha_pago || new Date(),
      referencia: referencia || null,
      notas: notas || null
    };

    const result = await service.registrarPago(
      ctx,
      solicitudId,
      payload,
      file
    );

    res.status(201).json({ 
      ok: true,
      message: "Pago registrado correctamente",
      data: result,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });

  } catch (err) {
    console.error("[registrarPago] error:", err);
    next(err);
  }
}


async function getPago(req, res) {
  try {
    const ctx = {
      empresaId: req.empresa_id,
      usuarioId: req.usuario?.id
    };

    const { id } = req.params;

    const pago = await service.getPagoById(ctx, id);

    if (!pago) {
      return res.status(404).json({
        ok: false,
        error: "Pago no encontrado"
      });
    }

    return res.json({ 
      ok: true,
      data: pago,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) {
    console.error("Error al obtener pago:", err);
    return res.status(500).json({
      ok: false,
      error: "Error interno del servidor"
    });
  }
}


async function getFactura(req, res, next) {
  try {
    const { id } = req.params;

    const solicitud = await service.getById(req.empresa_id, id);

    if (!solicitud) {
      return res.status(404).json({
        ok: false,
        msg: "Solicitud no encontrada"
      });
    }

    if (!solicitud.archivo_url) {
      return res.status(404).json({
        ok: false,
        msg: "Esta solicitud no tiene factura adjunta"
      });
    }

    return res.json({ 
      ok: true,
      archivo: solicitud.archivo_url,
      empresaContexto: {
        id: req.empresa_id,
        tipo: req.empresaTipo
      }
    });
  } catch (err) {
    console.error("[getFactura] error:", err);
    next(err);
  }
}

module.exports = {
  list,
  create,
  update,
  getById,
  approveWithFile,
  rejectWithComment,
  updateFactura,
  listPagos,
  registrarPago,
  getPago,
  getFactura
};
