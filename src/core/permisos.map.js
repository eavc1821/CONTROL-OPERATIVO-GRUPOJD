// Mapa central de permisos (ETAPA 1 - hardcodeado)
module.exports = {
  superadmin: ["*"],

  admin: [
    "solicitudes.listar",
    "solicitudes.ver",
    "solicitudes.crear",
    "solicitudes.editar",
    "solicitudes.pagar",
    "empresas.listar",
    "proveedores.listar",
    "proveedores.crear",
    "proveedores.editar",
    "reportes.ver",
    "pagos.editar",
    "pagos.ver",
    "pagos.listar"
  ],

  read: [
    "solicitudes.listar",
    "solicitudes.ver",
    "proveedores.listar",
    "reportes.ver",
    "empresas.listar"
  ]
};
