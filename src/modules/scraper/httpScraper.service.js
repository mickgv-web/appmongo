import axios from "axios";
import * as cheerio from "cheerio";
import { waitForDomainSlot } from "./domain-rate-limiter.js";
import { isUrlAllowed } from "./robots.service.js";

const USER_AGENT =
  process.env.SCRAPE_USER_AGENT ||
  "Mozilla/5.0 (compatible; ExtractorBot/1.0)";

export async function httpScrape(url) {
  try {
    console.log("Preparing HTTP scrape:", url);

    const allowed = await isUrlAllowed(url);

    if (!allowed) {
      return {
        results: [],
        blocked: [url],
        failed: [],
        needsBrowser: false,
      };
    }

    await waitForDomainSlot(url);

    console.log("HTTP scraping:", url);

    const { data } = await axios.get(url, {
      timeout: 5000,
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    const $ = cheerio.load(data);
    const text = $("body").text();

    const textEmails = extractEmails(text);

    const mailtoEmails = $("a[href^='mailto:']")
      .map((i, el) =>
        $(el).attr("href").replace(/^mailto:/, "").trim()
      )
      .get();

    const emails = [...new Set([...textEmails, ...mailtoEmails])];

    return {
      results: emails.map((email) => ({
        email,
        phone: null,
        sourceUrl: url,
      })),
      blocked: [],
      failed: [],
      needsBrowser: false,
    };

  } catch (error) {
    const status = error.response?.status;

    const browserRequired =
      status === 403 ||
      status === 406 ||
      status === 503;

    return {
      results: [],
      blocked: [],
      failed: browserRequired ? [] : [url],
      needsBrowser: browserRequired,
    };
  }
}

function extractEmails(text) {
  const matches = text.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
  );

  return matches ? [...new Set(matches)] : [];
}