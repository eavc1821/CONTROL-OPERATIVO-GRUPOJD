const puppeteer = require("puppeteer");

let browser;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ],
      headless: "new"
    });
  }
  return browser;
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

module.exports = {
  getBrowser,
  closeBrowser
};
