function formatDDMMYY(date) {
  if (!date) return "";
  const d = new Date(date);

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);

  return `${dd}/${mm}/${yy}`;
}

module.exports = { formatDDMMYY };