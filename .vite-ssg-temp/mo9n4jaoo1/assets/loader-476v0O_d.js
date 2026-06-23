import { a as fetchText } from "./ssr-fetch-DJg5wTjq.js";
async function loadMarkdown(path) {
  try {
    return await fetchText(path);
  } catch {
    return null;
  }
}
export {
  loadMarkdown as l
};
