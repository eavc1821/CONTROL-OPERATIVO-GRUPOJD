// src/core/validators.js
const { ZodError } = require("zod");

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        ok: false,
        message: "Error de validación",
        errors: result.error.errors
      });
    }

    // ✅ usar el body ya normalizado por Zod
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
