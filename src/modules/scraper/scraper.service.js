import axios from "axios";
import * as cheerio from "cheerio";
import pLimit from "p-limit";

const limit = pLimit(2);

export async function runScraping() {
  const urls = [
    "https://www.iana.org/domains/reserved",
    "https://example.com"
  ];

  const tasks = urls.map(url =>
    limit(() => scrapeUrl(url))
  );

  const results = await Promise.all(tasks);

  return results.flat();
}

async function scrapeUrl(url) {
  try {
    console.log("Scraping:", url);

    const { data } = await axios.get(url, {
      timeout: 5000
    });

    const $ = cheerio.load(data);
    const text = $("body").text();

    const emails = extractEmails(text);

    console.log("Found emails:", emails);

    return emails.map(email => ({
      email,
      phone: null,
      sourceUrl: url
    }));

  } catch (error) {
    console.error("Error scraping:", url);
    return [];
  }
}

function extractEmails(text) {
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  return matches ? [...new Set(matches)] : [];
}