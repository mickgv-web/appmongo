import Search from "./search.model.js";
import Contact from "./contact.model.js";
import { runScraping } from "../scraper/scraper.service.js";
import { resolveUrlsForQuery } from "./searchResolver.service.js";

const REFRESH_HOURS = parseInt(process.env.SCRAPE_REFRESH_HOURS || 6);
const REFRESH_WINDOW = REFRESH_HOURS * 60 * 60 * 1000;

function normalizeQuery(query) {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function handleSearch(query, { mode = "auto" } = {}) {
  const normalizedQuery = normalizeQuery(query);

  let search = await Search.findOne({ normalizedQuery });

  // CASO 1: No existe
  if (!search) {
    search = await Search.create({
      query,
      normalizedQuery,
      status: "processing",
    });

    triggerScraping(search, { mode });

    return {
      status: "processing",
      refreshing: false,
      total: 0,
      data: [],
      meta: {
        strategies: {},
        httpFailures: [],
      },
    };
  }

  // CASO 2: Existe
  const contacts = await Contact
    .find({ searchId: search._id })
    .sort({ createdAt: -1 });

  const isExpired =
    !search.lastUpdatedAt ||
    Date.now() - search.lastUpdatedAt.getTime() > REFRESH_WINDOW;

  let refreshing = false;

  if (isExpired && search.status !== "processing") {
    refreshing = true;

    await Search.updateOne(
      { _id: search._id },
      { status: "processing" }
    );

    search.status = "processing";

    triggerScraping(search, { mode });
  }

  return {
    status: search.status,
    refreshing,
    total: contacts.length,
    data: contacts,
    meta: {
      strategies: search.lastStrategySummary || {},
      httpFailures: search.lastHttpFailures || [],
    },
  };
}

function triggerScraping(search, { mode }) {
  setImmediate(async () => {
    try {
      console.log("Starting scraping for:", search.normalizedQuery);

      // Resolver URLs usando mode
      const urls = await resolveUrlsForQuery(
        search.normalizedQuery,
        { mode }
      );

      console.log("Resolved URLs:", urls);

      const {
        results = [],
        blocked = [],
        failed = [],
        strategyUsed = [],
        httpFailures = [],
      } = await runScraping(urls);

      // Resumen de estrategias
      const strategySummary = strategyUsed.reduce((acc, item) => {
        acc[item.strategy] = (acc[item.strategy] || 0) + 1;
        return acc;
      }, {});

      // Solo eliminamos e insertamos si hay resultados nuevos
      if (results.length > 0) {
        await Contact.deleteMany({ searchId: search._id });

        const docs = results.map((r) => ({
          ...r,
          searchId: search._id,
        }));

        await Contact.insertMany(docs);
        console.log("Inserted contacts:", docs.length);
      }

      if (blocked.length) {
        console.warn("Blocked URLs:", blocked);
      }

      if (failed.length) {
        console.warn("Failed URLs:", failed);
      }

      await Search.updateOne(
        { _id: search._id },
        {
          status: "idle",
          lastUpdatedAt: new Date(),
          lastStrategySummary: strategySummary,
          lastHttpFailures: httpFailures,
        }
      );

      console.log("Finished scraping:", search.normalizedQuery);

    } catch (error) {
      console.error("Scraping error:", error);

      await Search.updateOne(
        { _id: search._id },
        { status: "idle" }
      );
    }
  });
}