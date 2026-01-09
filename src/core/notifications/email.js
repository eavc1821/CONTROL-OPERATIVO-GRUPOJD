// src/core/notifications/email.js
const nodemailer = require("nodemailer");
const smtpPort = Number(process.env.SMTP_PORT);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465, // SSL si es 465, TLS si es 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmail({ to, subject, html, text, metadata }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html
    });

    console.log("📧 Email enviado", {
      to,
      messageId: info.messageId,
      metadata
    });

    return true;
  } catch (err) {
    console.error("❌ Error enviando email", err.message);
    throw err;
  }
}

module.exports = { sendEmail };
