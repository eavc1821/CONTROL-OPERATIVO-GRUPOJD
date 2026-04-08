const repo = require("./repository");

async function getClientesIngresos(req, res, next) {
  try {
    const data = await repo.getClientesIngresos();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

async function getOperadores(req, res, next) {
  try {
    const data = await repo.getOperadores();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

async function getCisternas(req, res, next) {
  try {
    const data = await repo.getCisternas();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getClientesIngresos,
  getOperadores,
  getCisternas,
};