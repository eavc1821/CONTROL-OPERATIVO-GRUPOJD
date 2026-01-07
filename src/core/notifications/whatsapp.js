// src/core/notifications/whatsapp.js
async function sendWhatsApp({ telefono, message, metadata }) {
  // 🧪 Fase 1: solo logs (recomendado)
  console.log("📲 WhatsApp →", {
    telefono,
    message,
    metadata
  });

  return true;
}

module.exports = {
  sendWhatsApp
};
