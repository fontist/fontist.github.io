import { P as PLANES, s as scriptGroup, b as blockDisplayName, p as planeForCodepoint, h as hexCp, m as safeChar } from "./constants-CAbDY4oD.js";
import { f as fetchJson } from "./ssr-fetch-DJg5wTjq.js";
let allBlocks = null;
async function loadAllBlocks() {
  if (allBlocks) return allBlocks;
  const raw = await fetchJson("unicode-blocks.json");
  allBlocks = raw.map((b) => ({
    name: b.name,
    start: b.start,
    end: b.end,
    range: hexCp(b.start) + "–" + hexCp(b.end),
    plane: planeForCodepoint(b.start),
    displayName: blockDisplayName(b.name),
    scriptGroup: scriptGroup(b.name),
    unicodeVersion: b.unicode_version || "1.1",
    characters: [],
    assignedCount: 0
  }));
  return allBlocks;
}
async function loadBlockCharacters(blockName) {
  const slug = blockName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  try {
    const data = await fetchJson(`unicode/blocks/${slug}.json`);
    return (data.chars || []).map((c) => ({
      ...c,
      cp: c.cp,
      hex: hexCp(c.cp),
      char: safeChar(c.cp),
      name: c.n || "",
      category: c.c || "",
      script: c.s || ""
    }));
  } catch {
    return [];
  }
}
function getPlanes(blocks) {
  return PLANES.map((p) => ({
    ...p,
    blocks: blocks.filter((b) => b.plane === p.key)
  }));
}
export {
  loadBlockCharacters as a,
  getPlanes as g,
  loadAllBlocks as l
};
