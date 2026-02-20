const sharp = require("sharp");

module.exports = async function svgToPngBuffer(svg) {

  if (!svg) return null;

  try {
    return await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

  } catch (err) {
    console.error("Error convirtiendo SVG:", err);
    return null;
  }
};