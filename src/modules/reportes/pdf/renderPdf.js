const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

module.exports = async function renderPdf(data) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  const html = fs.readFileSync(
    path.join(__dirname, "templates/reporteSolicitudes.html"),
    "utf8"
  );

  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.addStyleTag({
    path: path.join(__dirname, "styles/reporteSolicitudes.css")
  });

  await page.evaluate((data) => {
    window.__DATA__ = data;
  }, data);

  const pdf = await page.pdf({
    format: "A4",
    landscape: true,
    printBackground: true,
    margin: {
      top: "20mm",
      bottom: "15mm",
      left: "15mm",
      right: "15mm"
    }
  });

  await browser.close();
  return pdf;
};
