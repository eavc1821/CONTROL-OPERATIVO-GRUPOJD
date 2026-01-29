module.exports = (filtros) => `
  <div class="filters">
    <strong>Filtros aplicados:</strong>
    ${Object.entries(filtros)
      .map(([k, v]) => `<span>${k}: ${v}</span>`)
      .join(" · ")}
  </div>
`;
