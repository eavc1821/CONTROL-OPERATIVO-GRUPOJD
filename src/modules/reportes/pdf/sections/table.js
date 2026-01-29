module.exports = function buildTable(detalle) {
  const body = [
    [
      { text: "Correl.", style: "tableHeader" },
      { text: "Proveedor", style: "tableHeader" },
      { text: "Factura", style: "tableHeader" },
      { text: "Tipo", style: "tableHeader" },
      { text: "Total", style: "tableHeader", alignment: "right" },
      { text: "Pagado", style: "tableHeader", alignment: "right" },
      { text: "Saldo", style: "tableHeader", alignment: "right" },
      { text: "Estado", style: "tableHeader" }
    ],
    ...detalle.map(d => ([
      d.correlativo,
      { text: d.proveedor, noWrap: false },
      d.numero_factura || "-",
      d.tipo_pago,
      { text: `L. ${Number(d.total_solicitud).toLocaleString()}`, alignment: "right" },
      { text: `L. ${Number(d.total_pagado).toLocaleString()}`, alignment: "right" },
      { text: `L. ${Number(d.saldo).toLocaleString()}`, alignment: "right" },
      d.estado
    ]))
  ];

  return {
    table: {
      headerRows: 1,
      widths: [45, "*", 60, 50, 65, 65, 65, 55],
      body
    },
    layout: {
      fillColor: (rowIndex) =>
        rowIndex === 0 ? "#f1f5f9" : null,
      hLineColor: "#cbd5e1",
      vLineColor: "#cbd5e1",
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3
    }
  };
};
