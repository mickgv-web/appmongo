import * as cheerio from "cheerio";

export const type = "schema";

export function extract(html, url) {

  const $ = cheerio.load(html);

  const resources = [];
  const seen = new Set();

  $("script[type='application/ld+json']").each((_, el) => {

    const raw = $(el).html();

    if (!raw) return;

    try {

      const json = JSON.parse(raw.trim());

      processSchema(json);

    } catch {
      // JSON-LD a veces viene parcialmente mal formado
      // ignoramos para no romper el pipeline
    }

  });

  return resources;

  function add(resource) {

    const key = `${resource.type}:${resource.value}`;

    if (seen.has(key)) return;

    seen.add(key);

    resources.push(resource);

  }

  function processSchema(data) {

    if (!data) return;

    if (Array.isArray(data)) {
      data.forEach(processSchema);
      return;
    }

    if (typeof data !== "object") return;

    // soporte para @graph
    if (Array.isArray(data["@graph"])) {
      data["@graph"].forEach(processSchema);
    }

    const schemaType = data["@type"];

    // company / organization name
    if (data.name && typeof data.name === "string") {

      const metadata = {
        source: "schema.org"
      };

      if (schemaType) metadata.schemaType = schemaType;

      if (typeof data.url === "string")
        metadata.url = data.url.trim();

      if (typeof data.logo === "string")
        metadata.logo = data.logo.trim();

      if (typeof data.legalName === "string")
        metadata.legalName = data.legalName.trim();

      if (typeof data.foundingDate === "string")
        metadata.foundingDate = data.foundingDate.trim();

      add({
        type: "company_name",
        value: data.name.trim(),
        sourceUrl: url,
        metadata
      });

    }

    // phone
    if (typeof data.telephone === "string") {

      add({
        type: "phone",
        value: data.telephone.trim(),
        sourceUrl: url,
        metadata: {
          source: "schema.org",
          schemaType
        }
      });

    }

    // email
    if (typeof data.email === "string") {

      add({
        type: "email",
        value: data.email.trim().toLowerCase(),
        sourceUrl: url,
        metadata: {
          source: "schema.org",
          schemaType
        }
      });

    }

    // social links
    if (Array.isArray(data.sameAs)) {

      data.sameAs.forEach(link => {

        if (typeof link !== "string") return;

        add({
          type: "social",
          value: link.trim(),
          sourceUrl: url,
          metadata: {
            source: "schema.org",
            schemaType
          }
        });

      });

    }

    // recorrer propiedades internas
    Object.values(data).forEach(value => {

      if (typeof value === "object") {
        processSchema(value);
      }

    });

  }

}