const env = process.env.NODE_ENV || "development";

const originsByEnv = {
  production: [
    "https://control-operativo.gjd78.com",
  ],
  staging: [
    "https://co-staging.gjd78.com",
  ],
  development: [
    "http://localhost:5173",
  ],
};

module.exports = originsByEnv[env] || [];
