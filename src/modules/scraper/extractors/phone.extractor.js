import * as cheerio from "cheerio";

export const type = "phone";

export function extract(html, url) {

  const $ = cheerio.load(html);

  const phones = new Set();

  // eliminar zonas ruidosas
  $("script, style, noscript").remove();

  // 1️⃣ tel: links (muy fiable)
  $("a[href^='tel:']").each((_, el) => {

    const raw = $(el).attr("href").replace("tel:", "");
    const phone = normalize(raw);

    if (phone) phones.add(phone);

  });

  // 2️⃣ elementos de contacto comunes
  const selectors = [
    "footer",
    "header",
    "[class*=contact]",
    "[id*=contact]",
    "address"
  ];

  selectors.forEach(sel => {

    $(sel).each((_, el) => {

      const text = $(el).text();

      const matches =
        text.match(/(?:\+34|0034)?\s*[6789]\d{2}[\s\-]?\d{3}[\s\-]?\d{3}/g) || [];

      matches.forEach(raw => {

        const phone = normalize(raw);

        if (phone) phones.add(phone);

      });

    });

  });

  return [...phones].map(phone => ({
    type,
    value: phone,
    sourceUrl: url
  }));

}


function normalize(raw) {

  let phone = raw
    .replace(/[^\d+]/g, "")
    .replace(/^0034/, "+34");

  if (!phone.startsWith("+34")) {

    if (phone.length === 9) phone = "+34" + phone;
    else return null;

  }

  const digits = phone.replace("+34", "");

  if (!/^[6789]\d{8}$/.test(digits)) return null;

  return "+34" + digits;

}