import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync, renameSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Unit tests for the dirify-urls script logic.
// The script moves file-routes (foo.html → foo/index.html) so GitHub Pages
// resolves both /foo and /foo/. These tests verify the logic without a
// full VitePress build by creating a fake dist structure.

const TEST_DIST = join(tmpdir(), `test-dist-${Date.now()}`);

function createFakeDist() {
  mkdirSync(join(TEST_DIST, "blog"), { recursive: true });
  mkdirSync(join(TEST_DIST, "integrations"), { recursive: true });
  mkdirSync(join(TEST_DIST, "assets"), { recursive: true });
  writeFileSync(join(TEST_DIST, "index.html"), "<html>home</html>");
  writeFileSync(join(TEST_DIST, "404.html"), "<html>404</html>");
  writeFileSync(join(TEST_DIST, "about.html"), "<html>about</html>");
  writeFileSync(join(TEST_DIST, "README.html"), "<html>readme</html>");
  writeFileSync(join(TEST_DIST, "blog", "index.html"), "<html>blog index</html>");
  writeFileSync(join(TEST_DIST, "blog", "post.html"), "<html>blog post</html>");
  writeFileSync(join(TEST_DIST, "integrations", "github-actions.html"), "<html>ga</html>");
  writeFileSync(join(TEST_DIST, "assets", "style.css"), "body { color: red; }");
  writeFileSync(join(TEST_DIST, "sitemap.xml"), "<xml>sitemap</xml>");
}

function cleanup() {
  rmSync(TEST_DIST, { recursive: true, force: true });
}

describe("dirify-urls logic", () => {
  before(() => {
    cleanup();
    createFakeDist();

    const DIST = TEST_DIST;
    const HTML = ".html";
    const KEEP_AT_ROOT = new Set(["index.html", "404.html"]);

    function dirify(dir) {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) { dirify(full); continue; }
        if (!entry.endsWith(HTML)) continue;
        if (entry === "index.html") continue;
        if (dir === DIST && KEEP_AT_ROOT.has(entry)) continue;
        const name = entry.slice(0, -HTML.length);
        const targetDir = join(dir, name);
        mkdirSync(targetDir, { recursive: true });
        renameSync(full, join(targetDir, "index.html"));
      }
    }
    dirify(DIST);
  });
  after(() => { cleanup(); });

  it("moves about.html to about/index.html", () => {
    assert.ok(!existsSync(join(TEST_DIST, "about.html")), "about.html should be gone");
    assert.ok(existsSync(join(TEST_DIST, "about", "index.html")), "about/index.html should exist");
  });

  it("moves README.html to README/index.html", () => {
    assert.ok(!existsSync(join(TEST_DIST, "README.html")));
    assert.ok(existsSync(join(TEST_DIST, "README", "index.html")));
  });

  it("moves nested files (blog/post → blog/post/index.html)", () => {
    assert.ok(!existsSync(join(TEST_DIST, "blog", "post.html")));
    assert.ok(existsSync(join(TEST_DIST, "blog", "post", "index.html")));
  });

  it("moves nested files (integrations/github-actions)", () => {
    assert.ok(!existsSync(join(TEST_DIST, "integrations", "github-actions.html")));
    assert.ok(existsSync(join(TEST_DIST, "integrations", "github-actions", "index.html")));
  });

  it("keeps index.html at root", () => {
    assert.ok(existsSync(join(TEST_DIST, "index.html")), "index.html should remain at root");
  });

  it("keeps 404.html at root", () => {
    assert.ok(existsSync(join(TEST_DIST, "404.html")), "404.html should remain at root");
  });

  it("keeps directory-style index.html in place", () => {
    assert.ok(existsSync(join(TEST_DIST, "blog", "index.html")), "blog/index.html should remain");
  });

  it("does not touch non-HTML files", () => {
    assert.ok(existsSync(join(TEST_DIST, "assets", "style.css")), "assets/style.css should remain");
    assert.ok(existsSync(join(TEST_DIST, "sitemap.xml")), "sitemap.xml should remain");
  });
});
