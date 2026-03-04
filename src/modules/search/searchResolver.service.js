import { searchDuckDuckGo } from "./providers/duckduckgo.provider.js";
import { searchBing } from "./providers/bing.provider.js";

const TARGET_RESULTS = 10;
const OVERFETCH_FACTOR = 3;

const SEARCH_FETCH_LIMIT = TARGET_RESULTS * OVERFETCH_FACTOR;

export async function resolveUrlsForQuery(
  query,
  { mode = "auto" } = {}
) {

  let urls = [];

  switch (mode) {

    case "bing":
      urls = await searchBing(query, {
        limit: SEARCH_FETCH_LIMIT,
      });
      break;

    case "duckduckgo":
      urls = await searchDuckDuckGo(query, {
        limit: SEARCH_FETCH_LIMIT,
      });
      break;

    case "auto":
    default: {

      const [ddg, bing] = await Promise.all([
        searchDuckDuckGo(query, { limit: SEARCH_FETCH_LIMIT }),
        searchBing(query, { limit: SEARCH_FETCH_LIMIT }),
      ]);

      urls = [...ddg, ...bing];
      break;
    }
  }

  urls = filterDirectoryDomains(urls);

  urls = dedupeByDomain(urls);

  const finalUrls = urls.slice(0, TARGET_RESULTS);

  console.log("Resolved URLs:", finalUrls);

  return finalUrls;
}


function dedupeByDomain(urls) {

  const seen = new Set();
  const result = [];

  for (const url of urls) {

    try {
      const domain = new URL(url).hostname.replace(/^www\./, "");

      if (!seen.has(domain)) {
        seen.add(domain);
        result.push(url);
      }

    } catch {}

  }

  return result;
}


function filterDirectoryDomains(urls) {

  const domainCount = {};

  for (const url of urls) {
    try {
      const domain = new URL(url).hostname.replace(/^www\./, "");
      domainCount[domain] = (domainCount[domain] || 0) + 1;
    } catch {}
  }

  return urls.filter(url => {
    try {
      const domain = new URL(url).hostname.replace(/^www\./, "");
      return domainCount[domain] <= 2;
    } catch {
      return false;
    }
  });
}