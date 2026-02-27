import axios from "axios";
import * as cheerio from "cheerio";
import pLimit from "p-limit";

const limit = pLimit(2);

export async function runScraping() {
  const urls = [
    "https://www.w3.org/Consortium/contact"
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
      timeout: 5000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AppMongoBot/1.0)"
      }
    });

    const $ = cheerio.load(data);
    const text = $("body").text();

    // Emails en texto
    const textEmails = extractEmails(text);

    // Emails en mailto
    const mailtoEmails = $("a[href^='mailto:']")
      .map((i, el) => $(el).attr("href").replace(/^mailto:/, "").trim())
      .get();

    const emails = [...new Set([...textEmails, ...mailtoEmails])];

    console.log("Found emails:", emails);

    return emails.map(email => ({
      email,
      phone: null,
      sourceUrl: url
    }));

  } catch (error) {
    console.error("Error scraping:", url, error.message);
    return [];
  }
}

function extractEmails(text) {
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  return matches ? [...new Set(matches)] : [];
}