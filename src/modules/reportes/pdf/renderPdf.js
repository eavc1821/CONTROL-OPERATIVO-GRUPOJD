const path = require("path");
const fs = require("fs");
const { getBrowser } = require("./browser");
const { run } = require("./queue");


module.exports = async function renderPdf(html) {
  return run(async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: "networkidle0" });

      const buffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20mm",
          bottom: "20mm",
          left: "15mm",
          right: "15mm"
        }
      });

      return buffer;
    } finally {
      await page.close();
    }
  });
};

