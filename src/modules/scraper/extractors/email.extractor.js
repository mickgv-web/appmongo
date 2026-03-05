export const type = "email";

const ignoredDomains = ["example.com", "acme.com", "test.com"];

const ignoredValues = ["tu@email.com"];

function cleanEmail(email) {
  let cleaned = email.trim();

  // eliminar basura HTML escapada
  cleaned = cleaned.replace(/^u003e/i, "");
  cleaned = cleaned.replace(/^>/, "");

  // eliminar comillas o caracteres raros
  cleaned = cleaned.replace(/^["'(<\s]+/, "");
  cleaned = cleaned.replace(/[>"')\s]+$/, "");

  return cleaned.toLowerCase();
}

function isValidEmail(email) {
  if (!email.includes("@")) return false;

  if (ignoredValues.includes(email)) return false;

  const domain = email.split("@")[1];

  if (!domain) return false;

  if (ignoredDomains.includes(domain)) return false;

  return true;
}

export function extract(text, sourceUrl) {
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);

  if (!matches) return [];

  const unique = new Set();

  const resources = [];

  for (const raw of matches) {
    const email = cleanEmail(raw);

    if (!isValidEmail(email)) continue;

    if (unique.has(email)) continue;

    unique.add(email);

    resources.push({
      type,
      value: email,
      sourceUrl,
    });
  }

  return resources;
}
