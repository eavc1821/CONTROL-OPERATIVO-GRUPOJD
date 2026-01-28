module.exports = function buildTable(detalle) {
  const body = [
    [
      { text: "Correlativo", style: "tableHeader" },
      { text: "Proveedor", style: "tableHeader" },
      { text: "Factura", style: "tableHeader" },
      { text: "Tipo pago", style: "tableHeader" },
      { text: "Total", style: "tableHeader" },
      { text: "Pagado", style: "tableHeader" },
      { text: "Saldo", style: "tableHeader" },
      { text: "Estado", style: "tableHeader" }
    ],
    ...detalle.map(d => ([
      d.correlativo,
      d.proveedor,
      d.numero_factura || "-",
      d.tipo_pago,
      `L. ${Number(d.total_solicitud || 0).toLocaleString()}`,
      `L. ${Number(d.total_pagado || 0).toLocaleString()}`,
      `L. ${Number(d.saldo || 0).toLocaleString()}`,
      d.estado
    ]))
  ];

  return {
    table: {
      headerRows: 1,
      widths: ["*", "*", "*", "*", "*", "*", "*", "*"],
      body
    }
  };
};
