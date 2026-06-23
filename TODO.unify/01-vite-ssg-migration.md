# 01 — Migrate fontist.org from VitePress to vite-ssg

## Current State
- fontist.org uses VitePress 1.6.4
- `.vitepress/` directory with config.ts, theme/, components/, cache/
- Content: index.md, about.md, blog/*.md, integrations/*.md
- Build: `vitepress build && node scripts/dirify-urls.mjs`
- package.json has VitePress as devDependency

## Target State
- vite-ssg (same as formulas/docs/)
- `src/` directory with lib/, composables/, components/, pages/, styles/, layouts/
- `index.html`, `main.ts`, `App.vue`, `vite.config.ts`, `router.ts`
- VitePress dependency removed

## Steps

### 1.1 Update package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite-ssg build",
    "preview": "vite preview"
  },
  "dependencies": {
    "marked": "^18.0.5",
    "vue": "^3.5.0",
    "vue-router": "^4.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.0",
    "typescript": "^5.9.3",
    "vite": "^5.4.0",
    "vite-ssg": "^0.24.3",
    "prettier": "^3.8.1"
  }
}
```

### 1.2 Create vite-ssg infrastructure
- `vite.config.ts` — base path, vue plugin
- `index.html` — entry HTML with Google Fonts links
- `main.ts` — app entry, creates router
- `App.vue` — root component with RouterView
- `router.ts` — route definitions (starts minimal, grows in Phase 2-3)
- `src/layouts/DefaultLayout.vue` — nav bar + footer wrapper

### 1.3 Preserve existing content
- Convert `index.md` → `src/pages/HomePage.vue` (keep content, add to route)
- Convert `about.md` → `src/pages/AboutPage.vue`
- Convert `blog/` → `src/pages/BlogPage.vue` + `src/pages/BlogPostPage.vue`
- Convert `integrations/` → `src/pages/IntegrationsPage.vue`
- Keep markdown rendering via `marked` for blog posts

### 1.4 Remove VitePress
- Delete `.vitepress/` directory
- Remove `scripts/dirify-urls.mjs` (vite-ssg handles clean URLs)
- Run `npm install` to update lock file

## Verification
- `npm run dev` starts without errors
- Home page loads at `/`
- Blog index loads
- About page loads
- No VitePress references remain in codebase
