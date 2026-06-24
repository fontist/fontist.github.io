import type { RouteRecordRaw } from 'vue-router'
import { findFamilyByFormula } from './lib/fonts/families-loader'

async function fontRedirect(to: { params: Record<string, string | string[]> }): Promise<string> {
  const slug = Array.isArray(to.params.slug) ? to.params.slug.join('/') : to.params.slug
  const family = await findFamilyByFormula(slug)
  return family ? `/fonts/${family.slug}` : '/formulas'
}

async function fontUnicodeRedirect(to: { params: Record<string, string | string[]> }): Promise<string> {
  const slug = Array.isArray(to.params.slug) ? to.params.slug.join('/') : to.params.slug
  const family = await findFamilyByFormula(slug)
  return family ? `/fonts/${family.slug}/unicode` : '/formulas'
}

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('./pages/HomePage.vue') },
  { path: '/about', name: 'about', component: () => import('./pages/AboutPage.vue') },
  { path: '/blog', name: 'blog', component: () => import('./pages/BlogIndexPage.vue') },
  { path: '/blog/:slug', name: 'blog-post', component: () => import('./pages/BlogPostPage.vue') },
  { path: '/font/:slug(.+)/unicode/:block', redirect: fontUnicodeRedirect },
  { path: '/font/:slug(.+)/unicode', redirect: fontUnicodeRedirect },
  { path: '/font/:slug(.+)', name: 'font-redirect', redirect: fontRedirect },
  { path: '/fonts', name: 'fonts-index', component: () => import('./pages/FontsPage.vue') },
  { path: '/fonts/:familySlug(.+)', name: 'font-family', component: () => import('./pages/FontFamilyPage.vue') },
  { path: '/fonts/:familySlug(.+)/unicode', name: 'font-family-unicode', component: () => import('./pages/FontFamilyUnicodePage.vue') },
  { path: '/formulas/:slug(.+)', name: 'formula', component: () => import('./pages/FormulaPage.vue') },
  { path: '/formulas', name: 'formulas', component: () => import('./pages/BrowsePage.vue') },
  { path: '/compare', name: 'compare', component: () => import('./pages/ComparePage.vue') },
  { path: '/compare/:fonts', name: 'compare-fonts', component: () => import('./pages/ComparePage.vue') },
  { path: '/unicode', name: 'unicode', component: () => import('./pages/UnicodePage.vue') },
  { path: '/unicode/plane/:planeId', name: 'unicode-plane', component: () => import('./pages/UnicodePlanePage.vue') },
  { path: '/unicode/block/:blockSlug', name: 'unicode-block', component: () => import('./pages/UnicodeBlockPage.vue') },
  { path: '/unicode/char/:hex', name: 'unicode-char', component: () => import('./pages/UnicodeCharPage.vue') },
  { path: '/unicode/scripts', name: 'unicode-scripts', component: () => import('./pages/PropertyListPage.vue'), props: { property: 'scripts', title: 'Scripts', label: 'scripts' } },
  { path: '/unicode/scripts/:code', name: 'unicode-script', component: () => import('./pages/PropertyDetailPage.vue'), props: { property: 'scripts', title: 'Script' } },
  { path: '/unicode/category', name: 'unicode-categories', component: () => import('./pages/PropertyListPage.vue'), props: { property: 'category', title: 'Character Categories', label: 'categories' } },
  { path: '/unicode/category/:code', name: 'unicode-category', component: () => import('./pages/PropertyDetailPage.vue'), props: { property: 'category', title: 'Category' } },
  { path: '/unicode/combining', name: 'unicode-combining', component: () => import('./pages/PropertyListPage.vue'), props: { property: 'combining', title: 'Combining Classes', label: 'classes' } },
  { path: '/unicode/combining/:cc', name: 'unicode-combining-class', component: () => import('./pages/PropertyDetailPage.vue'), props: { property: 'combining', title: 'Combining Class' } },
  { path: '/unicode/bidiclass', name: 'unicode-bidiclasses', component: () => import('./pages/PropertyListPage.vue'), props: { property: 'bidiclass', title: 'Bidirectional Classes', label: 'classes' } },
  { path: '/unicode/bidiclass/:bc', name: 'unicode-bidiclass', component: () => import('./pages/PropertyDetailPage.vue'), props: { property: 'bidiclass', title: 'Bidirectional Class' } },
  { path: '/guide', name: 'guide-index', component: () => import('./pages/GuideIndexPage.vue') },
  { path: '/guide/:path(.*)*', name: 'guide', component: () => import('./pages/GuidePage.vue') },
  { path: '/licenses', name: 'licenses-index', component: () => import('./pages/LicensesIndexPage.vue') },
  { path: '/licenses/:path(.*)*', name: 'licenses', component: () => import('./pages/LicensePage.vue') },
  { path: '/:path(.*)*', name: 'not-found', component: () => import('./pages/NotFound.vue') },
]
