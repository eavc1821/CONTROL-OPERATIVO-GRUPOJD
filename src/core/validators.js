// src/core/validators.js
const { ZodError } = require("zod");

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

module.exports = { validate };
