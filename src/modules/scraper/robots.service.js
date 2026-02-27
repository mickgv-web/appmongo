import axios from "axios";

const robotsCache = new Map();

const RESPECT_ROBOTS =
  process.env.SCRAPE_RESPECT_ROBOTS !== "false";

export async function isUrlAllowed(url) {
  if (!RESPECT_ROBOTS) {
    console.warn("Robots.txt disabled via config");
    return true;
  }

  const { origin, pathname } = new URL(url);

  let rules = robotsCache.get(origin);

  if (!rules) {
    try {
      const robotsUrl = `${origin}/robots.txt`;
      const { data } = await axios.get(robotsUrl, {
        timeout: 3000,
      });

      rules = parseRobots(data);
      robotsCache.set(origin, rules);

    } catch (err) {
      // Si no existe robots.txt → permitimos
      robotsCache.set(origin, []);
      return true;
    }
  }

  return !rules.some(rule => pathname.startsWith(rule));
}

function parseRobots(content) {
  const lines = content.split("\n");
  const disallowed = [];

  let appliesToAll = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.toLowerCase().startsWith("user-agent:")) {
      const agent = trimmed.split(":")[1].trim();
      appliesToAll = agent === "*";
    }

    if (appliesToAll && trimmed.toLowerCase().startsWith("disallow:")) {
      const path = trimmed.split(":")[1].trim();
      if (path) {
        disallowed.push(path);
      }
    }
  }

  return disallowed;
}