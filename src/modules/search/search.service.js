import Search from "./search.model.js";
import Contact from "./contact.model.js";
import { runScraping } from "../scraper/scraper.service.js";

const REFRESH_HOURS = parseInt(process.env.SCRAPE_REFRESH_HOURS || 6);
const REFRESH_WINDOW = REFRESH_HOURS * 60 * 60 * 1000;

function normalizeQuery(query) {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function handleSearch(query) {
  const normalizedQuery = normalizeQuery(query);

  let search = await Search.findOne({ normalizedQuery });

  // 🔵 CASO 1: No existe → crear y procesar
  if (!search) {
    search = await Search.create({
      query,
      normalizedQuery,
      status: "processing"
    });

    triggerScraping(search);

    return {
      status: "processing",
      data: []
    };
  }

  // 🔵 CASO 2: Existe
  const contacts = await Contact.find({ searchId: search._id });

  const isExpired =
    !search.lastUpdatedAt ||
    Date.now() - search.lastUpdatedAt.getTime() > REFRESH_WINDOW;

  // 🔒 Evitar doble scraping
  if (isExpired && search.status !== "processing") {
    await Search.updateOne(
      { _id: search._id },
      { status: "processing" }
    );

    triggerScraping(search);
  }

  return {
    status: search.status,
    data: contacts
  };
}

function triggerScraping(search) {
  setImmediate(async () => {
    try {
      //const results = await runScraping(search.query);
      const results = await runScraping();

      await Contact.deleteMany({ searchId: search._id });

      const docs = results.map(r => ({
        ...r,
        searchId: search._id
      }));

      if (docs.length) {
        await Contact.insertMany(docs);
      }

      await Search.updateOne(
        { _id: search._id },
        {
          status: "idle",
          lastUpdatedAt: new Date()
        }
      );
    } catch (error) {
      console.error("Scraping error:", error);

      await Search.updateOne(
        { _id: search._id },
        { status: "idle" }
      );
    }
  });
}