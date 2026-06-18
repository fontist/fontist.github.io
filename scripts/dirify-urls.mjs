#!/usr/bin/env node
// Convert VitePress file-style output (about.html) into directory-style
// (about/index.html) so GitHub Pages resolves BOTH /about and /about/.
//
// VitePress `cleanUrls: true` builds about.md -> about.html and emits links
// like /about. GitHub Pages serves /about -> about.html (200) but /about/ ->
// about/index.html (404, because about.html is a file, not a directory).
// Moving each non-index *.html to <name>/index.html makes both forms resolve.
//
// Kept at the dist root:
//   - index.html   (the site root)
//   - 404.html     (GitHub Pages serves /404.html as the site-wide 404 page)
//
// Idempotent: safe to run repeatedly.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

const DIST = ".vitepress/dist";
const HTML = ".html";
const KEEP_AT_ROOT = new Set(["index.html", "404.html"]);

let moved = 0;
let skipped = 0;

function dirify(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      dirify(full);
      continue;
    }
    if (!entry.endsWith(HTML)) continue;
    if (entry === "index.html") continue; // already directory-style
    if (dir === DIST && KEEP_AT_ROOT.has(entry)) {
      skipped++; // root index.html / 404.html stay put
      continue;
    }
    const name = entry.slice(0, -HTML.length);
    const targetDir = join(dir, name);
    const targetIndex = join(targetDir, "index.html");
    if (existsSync(targetIndex)) {
      console.warn(
        `[dirify] skip ${full.replace(DIST + "/", "")}: target index.html already exists`,
      );
      skipped++;
      continue;
    }
    mkdirSync(targetDir, { recursive: true });
    renameSync(full, targetIndex);
    moved++;
  }
}

dirify(DIST);
console.log(
  `[dirify] moved ${moved} file-route(s) to directory form, kept ${skipped} at root`,
);
