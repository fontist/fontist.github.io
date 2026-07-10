# 01 — Astro project scaffold

## Why
Set up the Astro project alongside the existing Vue app so both run in
parallel during migration. Each page can be migrated one at a time.

## Steps

1. Install Astro + Vue integration:
   ```bash
   npm install astro @astrojs/vue
   ```

2. Create `astro.config.mjs`:
   ```js
   import { defineConfig } from 'astro/config'
   import vue from '@astrojs/vue'
   import tailwindcss from '@tailwindcss/vite'

   export default defineConfig({
     integrations: [vue({ appEntrypoint: '/src/pages/_app' })],
     vite: { plugins: [tailwindcss()] },
     output: 'static',
     site: 'https://www.fontist.org',
   })
   ```

3. Create `src/pages/_app.ts` — Astro layout entry (replaces `src/main.ts`).

4. Move existing pages to `src/pages/` one at a time (Astro uses file-based
   routing: `src/pages/index.astro` → `/`, `src/pages/about.astro` → `/about`).

5. Keep `vite.config.ts` + `vite-ssg` working until all pages are migrated,
   then remove.

## Acceptance
- [ ] `astro.config.mjs` created and valid
- [ ] `npm run astro dev` starts dev server on port 4321
- [ ] Tailwind 4 CSS loads in Astro
- [ ] One page (e.g., `/about`) renders via Astro
- [ ] All Vitest tests still pass
