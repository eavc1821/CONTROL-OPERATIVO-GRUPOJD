// src/core/validators.js
const { ZodError } = require("zod");

function normalizeEmptyStrings(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const normalized = { ...obj };

  Object.keys(normalized).forEach(key => {
    if (normalized[key] === "") {
      normalized[key] = null;
    }
  });

  return normalized;
}

// ✅ VALIDACIÓN NORMAL (CREATE)
function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          ok: false,
          message: "Error de validación",
          errors: err.errors
        });
      }
      next(err);
    }
  };
}

// ✅ VALIDACIÓN CON NORMALIZACIÓN (UPDATE)
function validatePartial(schema) {
  return (req, res, next) => {
    try {
      req.body = normalizeEmptyStrings(req.body);
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          ok: false,
          message: "Error de validación",
          errors: err.errors
        });
      }
      next(err);
    }
  };
}

module.exports = {
  validate,
  validatePartial
};
