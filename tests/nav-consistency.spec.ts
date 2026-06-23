import { test, expect } from "@playwright/test";

// STALE — VitePress-era test, not run by `npm test` (only `*.test.mjs` runs).
//
// Targets `.VPNavBar*` selectors from the legacy VitePress theme. After the
// vite-ssg migration, the nav is in `src/layouts/DefaultLayout.vue` using
// `.nav-link` and `.nav-*` classes. To revive this test, rewrite selectors
// against the new layout and add a `*.test.mjs` or Playwright config that
// `npm test` will pick up.
//
// Left in-tree as a cleanup candidate — do not assume it passes today.

const EXPECTED = {
  fontFamily: /IBM Plex Mono/i,
  fontSize: "12px",
  textTransform: "uppercase",
  fontWeight: "500",
  color: /rgb\(74, 71, 68\)/, // var(--spec-ink-soft)
};

test.describe("Nav element consistency (VitePress overrides)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".VPNavBar", { state: "visible" });
  });

  test("regular nav links match specimen styling", async ({ page }) => {
    const links = page.locator(".VPNavBarMenuLink");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const cs = await links.nth(i).evaluate((el) => {
        const s = getComputedStyle(el);
        return { fontFamily: s.fontFamily, fontSize: s.fontSize, textTransform: s.textTransform, color: s.color, fontWeight: s.fontWeight };
      });
      expect(cs.fontSize).toBe(EXPECTED.fontSize);
      expect(cs.textTransform).toBe(EXPECTED.textTransform);
      expect(cs.fontFamily).toMatch(EXPECTED.fontFamily);
    }
  });

  test("Integrations dropdown button text matches", async ({ page }) => {
    const text = page.locator(".VPNavBarMenuGroup .button .text");
    await expect(text).toBeVisible();
    const cs = await text.evaluate((el) => {
      const s = getComputedStyle(el);
      return { fontSize: s.fontSize, color: s.color, textTransform: s.textTransform };
    });
    expect(cs.fontSize).toBe(EXPECTED.fontSize);
    expect(cs.textTransform).toBe(EXPECTED.textTransform);
  });

  test("ellipsis/extra button text matches", async ({ page }) => {
    const text = page.locator(".VPNavBarExtra .button .text");
    const cs = await text.evaluate((el) => {
      const s = getComputedStyle(el);
      return { fontSize: s.fontSize, textTransform: s.textTransform };
    });
    expect(cs.fontSize).toBe(EXPECTED.fontSize);
    expect(cs.textTransform).toBe(EXPECTED.textTransform);
  });

  test("flyout menu link (GitHub Actions) matches", async ({ page }) => {
    const link = page.locator(".VPMenu .VPMenuLink a").first();
    const cs = await link.evaluate((el) => {
      const s = getComputedStyle(el);
      return { fontSize: s.fontSize, color: s.color, textTransform: s.textTransform };
    });
    expect(cs.fontSize).toBe(EXPECTED.fontSize);
    expect(cs.textTransform).toBe(EXPECTED.textTransform);
  });

  test("Appearance label in ellipsis menu matches", async ({ page }) => {
    const label = page.locator(".VPMenu .item .label").first();
    const cs = await label.evaluate((el) => {
      const s = getComputedStyle(el);
      return { fontSize: s.fontSize, fontFamily: s.fontFamily, textTransform: s.textTransform };
    });
    expect(cs.fontSize).toBe(EXPECTED.fontSize);
    expect(cs.textTransform).toBe(EXPECTED.textTransform);
    expect(cs.fontFamily).toMatch(EXPECTED.fontFamily);
  });

  test("nav bar background is opaque (no content leak on scroll)", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 600));
    const bg = await page.locator(".VPNavBar").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
  });
});
