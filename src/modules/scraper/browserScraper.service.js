import { chromium } from "playwright";
import { runExtractors } from "./extractorEngine.js";

export async function browserScrape(url) {

  console.log("Launching Playwright for:", url);

  let browser;

  try {

    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 15000,
    });

    const content = await page.content();

    const resources = runExtractors(content, url);

    console.log("Browser extracted resources:", resources.length);

    return {
      results: resources,
      blocked: [],
      failed: [],
    };

  } catch (error) {

    console.error(
      "Browser scraping failed:",
      url,
      error.message
    );

    return {
      results: [],
      blocked: [],
      failed: [url],
    };

  } finally {

    if (browser) {
      await browser.close();
    }

  }

}