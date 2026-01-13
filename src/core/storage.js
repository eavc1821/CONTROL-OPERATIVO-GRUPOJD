const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET = process.env.AWS_S3_BUCKET;
const PUBLIC_URL = process.env.AWS_S3_PUBLIC_URL;

async function saveFileS3({ tempPath, originalName, entidad, entidadId, correlativo, empresaId, empresaNombre }) {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");

  const slug = (empresaNombre || `empresa_${empresaId}`)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  const key = `empresas/${empresaId}_${slug}/${entidad}s/${correlativo || entidadId}/${Date.now()}_${safeName}`;


  const fileStream = fs.createReadStream(tempPath);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: "application/pdf"
    })
  );

  fs.unlinkSync(tempPath);

  return {
    path: `s3://${BUCKET}/${key}`,
    url: `${PUBLIC_URL}/${key}`
  };
}

module.exports = {
  saveFileS3
};
