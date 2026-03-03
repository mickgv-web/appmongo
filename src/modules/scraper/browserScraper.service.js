import { chromium } from "playwright";

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

    const emails = extractEmails(content);

    console.log("Browser found emails:", emails.length);

    return {
      results: emails.map((email) => ({
        email,
        phone: null,
        sourceUrl: url,
      })),
      blocked: [],
      failed: [],
    };
  } catch (error) {
    console.error("Browser scraping failed:", url, error.message);

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

function extractEmails(text) {
  const matches = text.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
  );
  return matches ? [...new Set(matches)] : [];
}