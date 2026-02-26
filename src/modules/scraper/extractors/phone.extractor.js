export function extractPhones(text) {
  const matches = text.match(/\+?\d[\d\s-]{7,}/g);
  return matches ? [...new Set(matches)] : [];
}