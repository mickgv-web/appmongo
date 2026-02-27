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
      status: "processing",
    });

    triggerScraping(search);

    return {
      status: "processing",
      refreshing: false,
      total: 0,
      data: [],
    };
  }

  // 🔵 CASO 2: Existe
  const contacts = await Contact
    .find({ searchId: search._id })
    .sort({ createdAt: -1 });

  const isExpired =
    !search.lastUpdatedAt ||
    Date.now() - search.lastUpdatedAt.getTime() > REFRESH_WINDOW;

  let refreshing = false;

  // 🔒 Evitar doble scraping
  if (isExpired && search.status !== "processing") {
    refreshing = true;

    await Search.updateOne(
      { _id: search._id },
      { status: "processing" }
    );

    // 🔥 Muy importante: sincronizamos el objeto en memoria
    search.status = "processing";

    triggerScraping(search);
  }

  return {
    status: search.status,
    refreshing,
    total: contacts.length,
    data: contacts,
  };
}

function triggerScraping(search) {
  setImmediate(async () => {
    try {
      console.log("Starting scraping for:", search.normalizedQuery);

      //const results = await runScraping(search.query);
      const results = await runScraping();

      await Contact.deleteMany({ searchId: search._id });

      const docs = results.map((r) => ({
        ...r,
        searchId: search._id,
      }));

      if (docs.length) {
        await Contact.insertMany(docs);
        console.log("Inserted contacts:", docs.length);
      }

      await Search.updateOne(
        { _id: search._id },
        {
          status: "idle",
          lastUpdatedAt: new Date(),
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