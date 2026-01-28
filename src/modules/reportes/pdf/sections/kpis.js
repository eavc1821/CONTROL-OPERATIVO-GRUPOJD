module.exports = function buildKpis(detalle) {
  const total_solicitado = detalle.reduce((s, d) => s + Number(d.total_solicitud || 0), 0);
  const total_pagado = detalle.reduce((s, d) => s + Number(d.total_pagado || 0), 0);
  const saldo_pendiente = detalle.reduce((s, d) => s + Number(d.saldo || 0), 0);

  return {
    columns: [
      {
        width: "25%",
        stack: [
          { text: "Total solicitado", style: "kpiLabel" },
          { text: `L. ${total_solicitado.toLocaleString()}`, style: "kpiValue" }
        ]
      },
      {
        width: "25%",
        stack: [
          { text: "Total pagado", style: "kpiLabel" },
          { text: `L. ${total_pagado.toLocaleString()}`, style: "kpiValue" }
        ]
      },
      {
        width: "25%",
        stack: [
          { text: "Saldo pendiente", style: "kpiLabel" },
          { text: `L. ${saldo_pendiente.toLocaleString()}`, style: "kpiValue" }
        ]
      },
      {
        width: "25%",
        stack: [
          { text: "Solicitudes", style: "kpiLabel" },
          { text: detalle.length, style: "kpiValue" }
        ]
      }
    ],
    margin: [0, 0, 0, 12]
  };
};
