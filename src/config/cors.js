const env = process.env.NODE_ENV || "development";

const originsByEnv = {
  production: [
    // Frontend PROD
    "https://control-operativo.gjd78.com",
    // Backend PROD (para forms HTML)
    "https://control-operativo-grupojd-production.up.railway.app",
  ],
  staging: [
    // Frontend STAGING
    "https://co-staging.gjd78.com",
    // Backend STAGING (HTML aprobaciones)
    "https://control-operativo-grupojd-staging.up.railway.app",
  ],
  development: [
    "http://localhost:5173",
    "http://localhost:3000",
  ],
};

module.exports = originsByEnv[env] || [];
