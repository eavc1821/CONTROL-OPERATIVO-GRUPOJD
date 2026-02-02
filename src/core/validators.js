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

function validate(schema) {
  return (req, res, next) => {
    try {
      // ✅ NORMALIZACIÓN PREVIA
      req.body = normalizeEmptyStrings(req.body);

      // ✅ VALIDACIÓN
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

module.exports = { validate };
