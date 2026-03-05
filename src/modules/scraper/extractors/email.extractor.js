export const type = "email";

export function extract(text, url) {

  const matches = text.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
  );

  if (!matches) return [];

  const unique = [...new Set(matches)];

  return unique.map(email => ({
    type,
    value: email,
    sourceUrl: url
  }));

}