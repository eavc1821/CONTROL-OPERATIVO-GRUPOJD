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
    "reportes.ver"
  ],

  read: [
    "solicitudes.listar",
    "solicitudes.ver",
    "proveedores.listar",
    "reportes.ver",
    "empresas.listar"
  ]
};
