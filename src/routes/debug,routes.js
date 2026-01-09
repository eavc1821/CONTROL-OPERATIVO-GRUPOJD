const express = require("express");
const router = express.Router();
const { sendEmail } = require("../core/notifications/email");

router.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "a.carcamo@gjd78.com",
      subject: "Prueba SMTP Railway + SiteGround",
      text: "Si recibes esto, SMTP está funcionando.",
      html: "<b>SMTP funcionando correctamente</b>"
    });

    res.json({ ok: true, message: "Email enviado" });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e.message
    });
  }
});

module.exports = router;
