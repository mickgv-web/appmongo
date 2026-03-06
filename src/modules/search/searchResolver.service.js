import { searchDuckDuckGo } from "./providers/duckduckgo.provider.js";
import { searchBing } from "./providers/bing.provider.js";

const TARGET_RESULTS = 10;
const OVERFETCH_FACTOR = 3;

const SEARCH_FETCH_LIMIT = TARGET_RESULTS * OVERFETCH_FACTOR;

const DIRECTORY_BLACKLIST = [
  "paxinasgalegas",
  "cylex",
  "yellowpages",
  "yelp",
  "tripadvisor",
  "findglocal",
  "firmania",
];

const DOMAIN_NOISE = [
  "youtube",
  "genius",
  "lyrics",
  "songlyrics",
  "lyricsondemand",
  "lyricsbox",
];

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
];

export async function resolveUrlsForQuery(query, { mode = "auto" } = {}) {
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

  urls = urls.map(normalizeUrl).filter(Boolean);
  urls = filterBlacklistedDomains(urls);
  urls = filterNoiseDomains(urls);
  urls = filterDirectoryDomains(urls);
  urls = dedupeByDomain(urls);

  const finalUrls = urls.slice(0, TARGET_RESULTS);

  console.log("Resolved URLs:", finalUrls);

  return finalUrls;
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);

    if (!u.protocol.startsWith("http")) return null;

    u.hostname = u.hostname.replace(/^www\./, "");

    TRACKING_PARAMS.forEach((param) => u.searchParams.delete(param));

    u.hash = "";

    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function filterBlacklistedDomains(urls) {
  return urls.filter((url) => {
    try {
      const domain = new URL(url).hostname.toLowerCase();

      return !DIRECTORY_BLACKLIST.some((b) => domain.includes(b));
    } catch {
      return false;
    }
  });
}

function filterNoiseDomains(urls) {
  return urls.filter((url) => {
    try {
      const domain = new URL(url).hostname.toLowerCase();

      return !DOMAIN_NOISE.some((n) => domain.includes(n));
    } catch {
      return false;
    }
  });
}

function dedupeByDomain(urls) {
  const domainCount = {};
  const result = [];

  for (const url of urls) {
    try {
      const domain = new URL(url).hostname.replace(/^www\./, "");

      if (!domainCount[domain]) {
        domainCount[domain] = 0;
      }

      if (domainCount[domain] < 2) {
        domainCount[domain]++;

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

  return urls.filter((url) => {
    try {
      const domain = new URL(url).hostname.replace(/^www\./, "");

      return domainCount[domain] <= 2;
    } catch {
      return false;
    }
  });
}
