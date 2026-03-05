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
  "facebook.com/sharer",
  "facebook.com/share",
  "twitter.com/intent",
  "linkedin.com/share",
  "linkedin.com/shareArticle"
];

export function extract(text, url) {

  const resources = [];

  for (const [platform, regex] of Object.entries(patterns)) {

    const matches = text.match(regex);

    if (!matches) continue;

    const unique = [...new Set(matches)];

    unique.forEach(link => {

      const lower = link.toLowerCase();

      const ignored = ignorePatterns.some(p => lower.includes(p));

      if (ignored) return;

      resources.push({
        type,
        value: link,
        sourceUrl: url,
        metadata: { platform }
      });

    });

  }

  return resources;

}