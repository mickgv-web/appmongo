import axios from "axios";
import * as cheerio from "cheerio";

export async function searchBing(query, { limit = 10 } = {}) {
  const searchUrl =
    `https://www.bing.com/search?q=${encodeURIComponent(query)}` +
    `&count=${limit}&setlang=en&form=QBLH`;

  try {
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(response.data);
    const urls = [];

    $("li.b_algo h2 a").each((_, el) => {
      const href = $(el).attr("href");

      if (!href) return;

      if (isValidHttpUrl(href)) {
        const cleanUrl = extractRealBingUrl(href);

        if (cleanUrl) {
            urls.push(cleanUrl);
        }
      }
    });

    const uniqueUrls = [...new Set(urls)];

    console.log("Bing Extracted URLs:", uniqueUrls);

    return uniqueUrls.slice(0, limit);

  } catch (error) {
    console.error("Bing provider error:", error.message);
    return [];
  }
}

function extractRealBingUrl(href) {
  try {
    const url = new URL(href);

    const encoded = url.searchParams.get("u");

    if (!encoded) return href;

    const base64 = encoded.replace(/^a1/, "");

    const decoded = Buffer.from(base64, "base64").toString("utf-8");

    return decoded;

  } catch {
    return null;
  }
}

function isValidHttpUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}