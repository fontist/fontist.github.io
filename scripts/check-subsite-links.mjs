#!/usr/bin/env node
// Post-build invariant check.
//
// /fontist/, /fontisan/, and /formulas/ are served by SEPARATE GitHub Pages
// repos (fontist/fontist, fontist/fontisan, fontist/formulas), not by this
// VitePress build. Links to them MUST trigger a full page load (server
// round-trip), otherwise VitePress's SPA router intercepts the click, fails
// to find the route, and renders its own 404 page.
//
// VitePress's router (node_modules/vitepress/dist/client/app/router.js)
// skips a link iff the <a> has a `target` attribute:
//
//     if (link.hasAttribute('target')) return;   // line ~134
//
// So this script enforces the proxy: every <a> in the built site whose href
// resolves (same-origin) to a subsite path must carry a `target` attribute.
// Run after `npm run build`. Fails the build (and thus the deploy) on regression.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "node-html-parser";

const SITE_ORIGIN = "https://www.fontist.org";
const SUBSITE_PATHS = ["/fontist", "/fontisan", "/formulas"];
const DIST_DIR = ".vitepress/dist";

function isSubsitePath(pathname) {
  // Normalize /fontist, /fontist/, /fontist/index.html, /fontist/foo.html → /fontist/…
  const clean = pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  return SUBSITE_PATHS.some(
    (sp) => clean === sp || clean.startsWith(sp + "/"),
  );
}

function walkHtml(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkHtml(full, out);
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

const offenders = [];
for (const file of walkHtml(DIST_DIR)) {
  const root = parse(readFileSync(file, "utf8"));
  for (const a of root.querySelectorAll("a")) {
    const href = a.getAttribute("href");
    if (!href) continue;
    let url;
    try {
      url = new URL(href, SITE_ORIGIN);
    } catch {
      continue; // non-url hrefs (anchors, mailto, etc.) — not our concern
    }
    if (url.origin === SITE_ORIGIN && isSubsitePath(url.pathname)) {
      const target = a.getAttribute("target");
      if (!target) {
        const rel = file.replace(DIST_DIR + "/", "");
        offenders.push(
          `${rel}: <a href="${href}"> has no target attribute — SPA router will intercept and 404`,
        );
      }
    }
  }
}

if (offenders.length > 0) {
  console.error(
    "✗ subsite-link check failed. Add target=\"_self\" to each offending <a>:\n",
  );
  console.error(offenders.map((o) => "  " + o).join("\n"));
  process.exit(1);
}

console.log(
  "✓ all subsite links carry a target attribute (bypass VitePress SPA router)",
);
