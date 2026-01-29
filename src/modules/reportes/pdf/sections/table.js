module.exports = (rows) => `
<table>
  <thead>
    <tr>
      <th>Correlativo</th>
      <th>Proveedor</th>
      <th>Factura</th>
      <th>Total</th>
      <th>Pagado</th>
      <th>Saldo</th>
      <th>Estado</th>
    </tr>
  </thead>
  <tbody>
    ${rows.map(r => `
      <tr>
        <td>${r.correlativo}</td>
        <td>${r.proveedor}</td>
        <td>${r.numero_factura}</td>
        <td>${r.total}</td>
        <td>${r.pagado}</td>
        <td>${r.saldo}</td>
        <td>${r.estado}</td>
      </tr>
    `).join("")}
  </tbody>
</table>
`;
