# 02 — Layout migration (DefaultLayout → Astro layout)

## Pattern reference: scoped styles with `@apply`

`src/pages/not-found.astro` is the canonical example of the scoped-style
pattern every migrating page should follow. Key points:

1. **Per-page `<style>` block at the bottom of the `.astro` file.** No
   styles for the page live in `src/styles/main.css`. (Global rules can
   stay in `main.css` until every page migrates off them.)
2. **`@reference "../styles/main.css"` at the top of the `<style>` block.**
   This tells Tailwind 4 "main.css is already loaded by the page; don't
   re-include its CSS, but DO make its `@theme` tokens available to
   `@apply`." Without `@reference`, `@apply text-ink`, `@apply font-body`,
   etc. fail with `Cannot apply unknown utility class`.
3. **Use `@apply` for Tailwind-idiomatic declarations** (colors, fonts,
   flex/grid patterns). Keep raw CSS for clamp(), pseudo-elements,
   @keyframes, ::-webkit-scrollbar.
4. **Astro auto-applies a `data-astro-cid-<hash>` attribute** to every
   element in the page and rewrites every selector in the scoped block to
   `[data-astro-cid-<hash>]`. Rules can't leak to other pages.
5. **The scoped styles are inlined in the page's `<head>`** at build time
   (not extracted into a shared CSS file), so each page only pays for the
   CSS it uses.

Example shape (from `not-found.astro`):

```astro
---
import '../styles/main.css'
---
<html lang="en"><head>…</head><body>
  <main class="nf">
    <h1 class="nf-title">…</h1>
  </main>
</body></html>

<style>
  @reference "../styles/main.css"

  .nf {
    @apply max-w-[720px] mx-auto font-body;
    padding: 3rem 1.5rem 5rem;
  }
  .nf-title {
    @apply font-display text-ink flex flex-col;
    /* … */
  }
</style>
```

## Why
`src/layouts/DefaultLayout.vue` is the shell — nav, footer, theme toggle,
router-outlet. In Astro, this becomes `src/layouts/DefaultLayout.astro` +
small Vue islands for the interactive parts (theme toggle, mobile nav).

## Inventory — what DefaultLayout does today
- Top nav bar (logo, primary links, mobile burger, theme toggle)
- `<RouterView />` outlet (replaced by `<slot />` in Astro)
- Site footer (already extracted as `SiteFooter.vue` — can become a Vue
  island or pure Astro)
- Paper-grain texture `<body::before>` overlay (in main.css, unchanged)
- Dark-mode class on `<html>` (`useTheme` composable)

## Steps

1. Create `src/layouts/DefaultLayout.astro`:
   ```astro
   ---
   import '../styles/main.css'
   import SiteFooter from '../components/SiteFooter.vue'
   import NavDocsDropdown from '../components/NavDocsDropdown.vue'
   const { title = 'Fontist' } = Astro.props
   ---
   <html>
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1" />
       <title>{title}</title>
       <slot name="head" />
     </head>
     <body>
       <nav class="nav">
         <!-- nav links inline -->
         <NavDocsDropdown client:idle />
       </nav>
       <main class="main"><slot /></main>
       <SiteFooter client:visible />
     </body>
   </html>
   ```

2. Migrate the nav bar markup from `DefaultLayout.vue` template. Strip
   `<RouterLink>` → plain `<a href>`. The mobile burger button becomes a
   Vue island (`NavBurger.vue`) with `client:load` because it toggles
   state on every page.

3. Theme toggle: keep `useTheme.ts` composable but call it from a small
   `ThemeToggle.vue` island mounted with `client:load`. Inline a tiny
   `<script is:inline>` in `<head>` that reads localStorage and sets
   `html.dark` BEFORE paint (avoids FOUC).

4. Footer: `SiteFooter.vue` is already a pure component — use it as a
   Vue island with `client:visible` (or no hydration if it's purely
   presentational; check if it has any onMounted logic).

5. Create `src/components/AstroNavLinks.astro` for the static top-nav
   links (no Vue hydration needed).

## Acceptance
- [ ] `DefaultLayout.astro` wraps content with the same visual chrome
- [ ] Dark-mode toggle works without FOUC
- [ ] Mobile burger collapses nav (test at <720px viewport)
- [ ] Footer renders identically
- [ ] No `<RouterLink>` references remain in the layout
- [ ] Lighthouse mobile nav is interactive before hydration

## Dependencies
- Phase 01 (Astro config + Tailwind 4 wired up)
