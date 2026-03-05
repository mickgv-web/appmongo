export const type = "social";

const patterns = {
  facebook: /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._\-\/]+/gi,
  instagram: /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._\-\/]+/gi,
  linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/[a-zA-Z0-9._\-\/]+/gi,
  twitter: /https?:\/\/(?:www\.)?(twitter|x)\.com\/[a-zA-Z0-9._\-\/]+/gi,
  youtube: /https?:\/\/(?:www\.)?youtube\.com\/[a-zA-Z0-9._\-\/]+/gi,
  tiktok: /https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9._\-\/]+/gi
};

const ignorePatterns = [
  "/share",
  "/sharer",
  "/intent",
  "/admin",
  "/posts",
  "/status",
  "/iframe",
  "/embed",
  "/hashtag",
];

function normalizeUrl(url) {

  let cleaned = url.trim();

  // quitar trailing slash
  cleaned = cleaned.replace(/\/+$/, "");

  // normalizar http/https
  cleaned = cleaned.replace(/^http:\/\//, "https://");

  return cleaned;
}

function isIgnored(url) {

  const lower = url.toLowerCase();

  return ignorePatterns.some(pattern =>
    lower.includes(pattern)
  );

}

export function extract(text, sourceUrl) {

  const resources = [];
  const seen = new Set();

  for (const [platform, regex] of Object.entries(patterns)) {

    const matches = text.match(regex);

    if (!matches) continue;

    for (const raw of matches) {

      const link = normalizeUrl(raw);

      if (isIgnored(link)) continue;

      if (seen.has(link)) continue;

      seen.add(link);

      resources.push({
        type,
        value: link,
        sourceUrl,
        metadata: { platform }
      });

    }

  }

  return resources;

}