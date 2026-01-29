module.exports = (empresa, metadata) => `
  <div class="header">
    <h1>${empresa.nombre}</h1>
    <p>Reporte de Solicitudes</p>
    <small>
      Periodo: ${metadata.periodo} ·
      Generado: ${new Date(metadata.generadoEn).toLocaleString("es-HN")}
    </small>
  </div>
`;
