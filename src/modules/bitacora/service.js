const repo = require("./repository");

async function registrar(context, payload) {
  if (!context || !context.usuario_id) return;

  const data = {
    usuario_id: context.usuario_id,
    empresa_id: context.empresa_id ?? null,
    ip: context.ip ?? null,
    user_agent: context.user_agent ?? null,
    ...payload
  };

  await repo.insert(data);
}

async function list(filters) {
  return repo.list(filters);
}

module.exports = { registrar, list };
