module.exports = function buildHeader({ empresaNombre, periodo }) {
  return {
    stack: [
      { text: empresaNombre, style: "empresa" },
      { text: "Reporte Administrativo", style: "titulo" },
      {
        text: `Periodo: ${periodo || "General"} · Generado: ${new Date().toLocaleString("es-HN")}`,
        style: "subtitulo"
      }
    ],
    margin: [0, 0, 0, 12]
  };
};
