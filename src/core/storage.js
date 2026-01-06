const fs = require('fs');
const fsp = fs.promises;
const path = require('path');


function ensureDirSync(dir) {
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}


function sanitizeName(name) {
return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}


async function saveFileLocal({ tempPath, originalName, entidad, entidadId, correlativo }) {
const base = path.join(__dirname, '../../uploads', `${entidad}_${entidadId}`);
ensureDirSync(base);
const ext = path.extname(originalName) || '.pdf';
const filename = `factura_${correlativo || entidadId}${ext}`;
const dest = path.join(base, sanitizeName(filename));
// mover el archivo (sync está bien si viene de multer.diskStorage)
fs.renameSync(tempPath, dest);
return { path: dest, url: `${process.env.BASE_URL}/uploads/${entidad}_${entidadId}/${sanitizeName(filename)}` };
}


async function saveBufferAsFile({ buffer, originalName, entidad, entidadId, correlativo, mimetype }) {
const base = path.join(__dirname, '../../uploads', `${entidad}_${entidadId}`);
ensureDirSync(base);
const ext = path.extname(originalName) || (mimetype ? '.' + mimetype.split('/')[1] : '.pdf');
const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${sanitizeName(originalName || 'file')}${ext}`;
const full = path.join(base, filename);
await fsp.writeFile(full, buffer);
return { path: full, url: `${process.env.BASE_URL}/uploads/${entidad}_${entidadId}/${sanitizeName(filename)}` };
}


module.exports = {
saveFileLocal,
saveBufferAsFile
};