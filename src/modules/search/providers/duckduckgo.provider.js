import axios from "axios";
import * as cheerio from "cheerio";

export async function searchDuckDuckGo(query, { limit = 5 } = {}) {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "es-ES,es;q=0.9",
      },
    });

    const $ = cheerio.load(response.data);
    const urls = [];

    $("a.result__a").each((_, el) => {
      let href = $(el).attr("href");
      if (!href) return;

      // Normalizar //duckduckgo.com/...
      if (href.startsWith("//")) {
        href = "https:" + href;
      }

      const cleanUrl = extractRealUrl(href);

      if (cleanUrl && isValidHttpUrl(cleanUrl)) {
        urls.push(cleanUrl);
      }
    });

    const uniqueUrls = [...new Set(urls)];

    console.log("DuckDuckGo Extracted URLs:", uniqueUrls);

    return uniqueUrls.slice(0, limit);

  } catch (error) {
    console.error("DuckDuckGo provider error:", error.message);
    return [];
  }
}

function extractRealUrl(href) {
  try {
    const url = new URL(href);

    const real = url.searchParams.get("uddg");

    if (real) {
      return decodeURIComponent(real);
    }

    return href;

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