import { f as fetchJson } from "./ssr-fetch-DJg5wTjq.js";
let cache = null;
async function loadAllFormulas() {
  if (cache) return cache;
  cache = await fetchJson("formulas-data.json");
  return cache;
}
async function findFormula(slug) {
  const all = await loadAllFormulas();
  return all.find((f) => f.slug === slug) || null;
}
export {
  findFormula as f,
  loadAllFormulas as l
};
