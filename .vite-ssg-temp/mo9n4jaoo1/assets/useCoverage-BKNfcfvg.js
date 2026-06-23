import { f as fetchJson } from "./ssr-fetch-DJg5wTjq.js";
function injectFontFace(slug, fontPath, redistributable) {
  const fontId = `ff-${slug.replace(/[^a-z0-9]/gi, "-")}`;
  function ensureInjected() {
    if (!fontPath) return false;
    return true;
  }
  return { fontId, ensureInjected };
}
const cache = /* @__PURE__ */ new Map();
async function fetchCoverage(slug) {
  if (cache.has(slug)) return cache.get(slug);
  try {
    const data = await fetchJson(`coverage/${slug}.json`);
    cache.set(slug, data);
    return data;
  } catch {
    return null;
  }
}
export {
  fetchCoverage as f,
  injectFontFace as i
};
