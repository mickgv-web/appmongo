import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extractorsDir = path.join(__dirname, "extractors");

const extractors = [];

await loadExtractors();

async function loadExtractors() {
  const files = fs.readdirSync(extractorsDir);

  const extractorFiles = files.filter((file) => file.endsWith(".extractor.js"));

  const modules = await Promise.all(
    extractorFiles.map((file) => {
      const modulePath = path.join(extractorsDir, file);

      return import(modulePath);
    }),
  );

  modules.forEach((mod, index) => {
    if (typeof mod.extract === "function") {
      console.log("Loaded extractor:", extractorFiles[index]);

      extractors.push(mod);
    }
  });
}

export function runExtractors(html, url) {
  const resources = [];

  for (const extractor of extractors) {
    try {
      const result = extractor.extract(html, url);

      if (result?.length) {
        resources.push(...result);
      }
    } catch (err) {
      console.warn("Extractor failed:", extractor.type, err.message);
    }
  }

  return resources;
}
