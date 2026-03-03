import { searchDuckDuckGo } from "./providers/duckduckgo.provider.js";

export async function resolveUrlsForQuery(query) {
  const urls = await searchDuckDuckGo(query, { limit: 10 });

  console.log("Resolved URLs:", urls);

  return urls;
}