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
const aprobacionesRoutes = require("./modules/aprobaciones/aprobaciones.routes");
const allowedOrigins = require("./config/cors");
const cuentasFinancierasRoutes = require("./modules/cuentas_financieras/routes");
const proveedorSucursalesRoutes = require("./modules/proveedores/ps.routes");
const aprobacionesService = require("./modules/aprobaciones/service");
const renderAprobacionHTML = require("./modules/aprobaciones/render");


const cors = require("cors");
const path = require("path");

const validateEnv = require('./bootstrap/validateEnv')

if (process.env.NODE_ENV === 'production') {
  validateEnv()
}


const app = express();


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

app.get("/aprobaciones", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("Enlace inválido");
    }

    const result = await aprobacionesService.previewByToken(token);

    if (result.status !== "OK") {
      return res.send(
        `<h3>${result.message || "Solicitud no disponible"}</h3>`
      );
    }

    const html = renderAprobacionHTML(result.solicitud);
    res.send(html);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar la solicitud");
  }
});



app.use("/api/v1/aprobaciones", aprobacionesRoutes);
app.use('/api/v1/solicitudes', solicitudesRoutes);
app.use('/api/v1/proveedores', proveedoresRoutes);
app.use('/api/v1/usuarios', usuariosRoutes);
app.use('/api/v1/pagos', pagosRoutes);
app.use('/api/v1/reportes', reportesRoutes);
app.use('/api/v1/categorias', categoriasRoutes);
app.use('/api/v1/empresas', empresasRoutes);
app.use("/api/v1/bitacora", bitacoraRoutes);
app.use("/api/v1/cuentas-financieras", cuentasFinancierasRoutes);
app.use("/api/v1", proveedorSucursalesRoutes);
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.use((err, req, res, next) => {
console.error(err);
res.status(err.status || 500).json({ ok: false, message: err.message || 'Internal Server Error' });
});


module.exports = app;