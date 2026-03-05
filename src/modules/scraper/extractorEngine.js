import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extractorsDir = path.join(__dirname, "extractors");

const extractors = [];

loadExtractors();

function loadExtractors() {

  const files = fs.readdirSync(extractorsDir);

  for (const file of files) {

    if (!file.endsWith(".extractor.js")) continue;

    const modulePath = path.join(extractorsDir, file);

    import(modulePath).then(mod => {

      if (typeof mod.extract === "function") {

        console.log("Loaded extractor:", file);

        extractors.push(mod);

      }

    });

  }

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

      console.warn(
        "Extractor failed:",
        extractor.type,
        err.message
      );

    }

  }

  return resources;

}