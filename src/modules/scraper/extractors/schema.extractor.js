import * as cheerio from "cheerio";

export const type = "schema";

export function extract(html, url) {

  const $ = cheerio.load(html);

  const resources = [];

  $("script[type='application/ld+json']").each((_, el) => {

    try {

      const json = JSON.parse($(el).html());

      processSchema(json);

    } catch {
      // ignorar JSON mal formado
    }

  });

  return resources;

  function processSchema(data) {

    if (Array.isArray(data)) {
      data.forEach(processSchema);
      return;
    }

    if (!data || typeof data !== "object") return;

    if (data.name) {

      resources.push({
        type: "company_name",
        value: data.name,
        sourceUrl: url
      });

    }

    if (data.telephone) {

      resources.push({
        type: "phone",
        value: data.telephone,
        sourceUrl: url,
        metadata: { source: "schema.org" }
      });

    }

    if (data.email) {

      resources.push({
        type: "email",
        value: data.email,
        sourceUrl: url,
        metadata: { source: "schema.org" }
      });

    }

    if (data.sameAs && Array.isArray(data.sameAs)) {

      data.sameAs.forEach(link => {

        resources.push({
          type: "social",
          value: link,
          sourceUrl: url,
          metadata: { source: "schema.org" }
        });

      });

    }

  }

}