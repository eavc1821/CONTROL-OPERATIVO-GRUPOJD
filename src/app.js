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
const debugRoutes = require('./routes/debug.routes');
const bitacoraRoutes = require("./modules/bitacora/routes");
const aprobacionesRoutes = require("./modules/aprobaciones/aprobaciones.routes");

const cors = require("cors");
const path = require("path");

const app = express();
const allowedOrigins = [
  "https://control-operativo.gjd78.com",
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (Postman, curl, jobs internos)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-empresa-id"],
  credentials: true
}));

app.options("*", cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use("/api/v1/aprobaciones", aprobacionesRoutes);
app.use('/api/v1/solicitudes', solicitudesRoutes);
app.use('/api/v1/proveedores', proveedoresRoutes);
app.use('/api/v1/usuarios', usuariosRoutes);
app.use('/api/v1/pagos', pagosRoutes);
app.use('/api/v1/reportes', reportesRoutes);
app.use('/api/v1/categorias', categoriasRoutes);
app.use('/api/v1/empresas', empresasRoutes);
app.use("/api/v1/bitacora", bitacoraRoutes);
app.use("/api/v1/debug", debugRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.use((err, req, res, next) => {
console.error(err);
res.status(err.status || 500).json({ ok: false, message: err.message || 'Internal Server Error' });
});


module.exports = app;