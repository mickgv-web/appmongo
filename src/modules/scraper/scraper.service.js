import pLimit from "p-limit";
import { httpScrape } from "./httpScraper.service.js";
import { browserScrape } from "./browserScraper.service.js";
import DomainStrategy from "./domainStrategy.model.js";

const MAX_CONCURRENCY = parseInt(
  process.env.SCRAPE_MAX_CONCURRENCY || 2
);

const limit = pLimit(MAX_CONCURRENCY);

export async function runScraping() {
  const urls = [
    "https://www.w3.org/Consortium/contact",
    "https://www.formacom.es/contacto",
  ];

  const tasks = urls.map((url) =>
    limit(() => scrapeWithStrategy(url))
  );

  const responses = await Promise.all(tasks);

  return {
    results: responses.flatMap((r) => r.results || []),
    blocked: responses.flatMap((r) => r.blocked || []),
    failed: responses.flatMap((r) => r.failed || []),

    strategyUsed: responses.map((r) => ({
      url: r.url,
      strategy: r.strategy,
    })),

    httpFailures: responses
      .filter((r) => r.httpFailed)
      .map((r) => r.url),
  };
}

function extractDomain(url) {
  return new URL(url).hostname;
}

async function scrapeWithStrategy(url) {
  const domain = extractDomain(url);

  // Miramos si ya aprendimos estrategia
  const strategyRecord = await DomainStrategy.findOne({ domain });

  // Si sabemos que necesita browser → vamos directo
  if (strategyRecord?.preferredStrategy === "browser") {
    console.log("Smart mode: using browser directly for:", domain);

    const browserResult = await browserScrape(url);

    return {
      ...browserResult,
      url,
      strategy: "browser",
      httpFailed: false,
    };
  }

  // Intentamos HTTP primero
  const httpResult = await httpScrape(url);

  // Si HTTP indica que necesita browser → aprendemos
  if (httpResult.needsBrowser) {
    console.log("Learning browser strategy for:", domain);

    await DomainStrategy.findOneAndUpdate(
      { domain },
      {
        preferredStrategy: "browser",
        lastUpdatedAt: new Date(),
      },
      { upsert: true }
    );

    const browserResult = await browserScrape(url);

    return {
      ...browserResult,
      url,
      strategy: "browser",
      httpFailed: true,
    };
  }

  // HTTP funciona → persistimos preferencia HTTP
  await DomainStrategy.findOneAndUpdate(
    { domain },
    {
      preferredStrategy: "http",
      lastUpdatedAt: new Date(),
    },
    { upsert: true }
  );

  return {
    ...httpResult,
    url,
    strategy: "http",
    httpFailed: false,
  };
}