const express = require('express');
const bodyParser = require('body-parser');
const solicitudesRoutes = require('./modules/solicitudes/solicitudes.routes');
const proveedoresRoutes = require('./modules/proveedores/proveedores.routes');
const usuariosRoutes = require('./modules/usuarios/usuarios.routes');
const pagosRoutes = require('./modules/pagos/pagos.routes');
const reportesRoutes = require('./modules/reportes/reportes.routes');
const categoriasRoutes = require('./modules/categorias/categorias.routes');
const empresasRoutes = require('./modules/empresas/empresas.routes');
const empresaMiddleware = require('./middlewares/empresa');
const bitacoraRoutes = require("./modules/bitacora/routes");

const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization, x-empresa-id"],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



app.use('/api/v1/solicitudes', solicitudesRoutes);
app.use('/api/v1/proveedores', proveedoresRoutes);
app.use('/api/v1/usuarios', usuariosRoutes);
app.use('/api/v1/pagos', pagosRoutes);
app.use('/api/v1/reportes', reportesRoutes);
app.use('/api/v1/categorias', categoriasRoutes);
app.use('/api/v1/empresas', empresasRoutes);
app.use("/api/v1/bitacora", bitacoraRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.use((err, req, res, next) => {
console.error(err);
res.status(err.status || 500).json({ ok: false, message: err.message || 'Internal Server Error' });
});


module.exports = app;