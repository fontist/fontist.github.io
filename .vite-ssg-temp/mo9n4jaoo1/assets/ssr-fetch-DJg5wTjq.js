let cwd;
function getCwd() {
  if (cwd) return cwd;
  cwd = process.cwd();
  return cwd;
}
async function fetchJson(path) {
  {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const filePath = resolve(getCwd(), "public", path.replace(/^\//, ""));
    const raw = readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  }
}
async function fetchText(path) {
  {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const filePath = resolve(getCwd(), "public", path.replace(/^\//, ""));
    return readFileSync(filePath, "utf8");
  }
}
export {
  fetchText as a,
  fetchJson as f
};
