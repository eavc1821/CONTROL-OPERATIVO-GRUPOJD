const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const BUCKET = process.env.AWS_S3_BUCKET;
const PUBLIC_URL = process.env.AWS_S3_PUBLIC_URL;

async function saveFileS3({ tempPath, originalName, entidad, entidadId, correlativo, empresaId }) {
  const ext = path.extname(originalName);
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");

  const key = `empresas/${empresaId}/${entidad}s/${correlativo || entidadId}/${Date.now()}_${safeName}`;

  const fileStream = fs.createReadStream(tempPath);

  const upload = await s3.upload({
    Bucket: BUCKET,
    Key: key,
    Body: fileStream,
    ContentType: "application/pdf",
    ACL: "private"
  }).promise();

  fs.unlinkSync(tempPath); // limpiar tmp

  return {
    path: `s3://${BUCKET}/${key}`,
    url: `${PUBLIC_URL}/${key}`
  };
}

module.exports = {
  saveFileS3
};
