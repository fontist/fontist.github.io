import { defineConfig, type HeadConfig } from "vitepress";

const SITE_ORIGIN = "https://www.fontist.org";
const DEFAULT_DESCRIPTION =
  "Install openly-licensed fonts on Windows, Linux and Mac!";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

// Map a page's source path to its canonical public URL, following VitePress
// clean URLs (no .html; index.md becomes the directory root).
function pathToUrl(relativePath: string): string {
  const base = relativePath.replace(/\.md$/, "").replace(/\\/g, "/");
  if (base === "index") return `${SITE_ORIGIN}/`;
  if (base.endsWith("/index")) return `${SITE_ORIGIN}/${base.slice(0, -6)}/`;
  return `${SITE_ORIGIN}/${base}`;
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: "en-US",

  // https://vitepress.dev/guide/routing#generating-clean-url
  cleanUrls: true,

  title: "Fontist",
  description: "Install openly-licensed fonts on Windows, Linux and Mac!",

  lastUpdated: true,

  // https://vitepress.dev/reference/site-config#sitemap
  sitemap: {
    hostname: SITE_ORIGIN,
  },

  // https://github.com/vuejs/vitepress/issues/3508
  base: process.env.BASE_PATH,

  head: [
    ["link", { rel: "icon", type: "image/png", href: "/favicon-96x96.png", sizes: "96x96" }],
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    ["link", { rel: "shortcut icon", href: "/favicon.ico" }],
    ["link", { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" }],
    ["link", { rel: "manifest", href: "/site.webmanifest" }],
    ["meta", { property: "og:type", content: "website" }],
  ],

  // Per-page og:* and twitter:* tags are derived from each page's frontmatter
  // title/description, with an absolute canonical URL and the site OG image.
  // Blog posts additionally get BlogPosting JSON-LD structured data.
  // https://vitepress.dev/reference/site-config#transformhead
  transformHead(ctx) {
    const { pageData } = ctx;
    const url = pathToUrl(pageData.relativePath);
    const title = pageData.title || "Fontist";
    const description = pageData.description || DEFAULT_DESCRIPTION;
    const image = pageData.frontmatter.image || DEFAULT_OG_IMAGE;

    const tags: HeadConfig[] = [
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: description }],
      ["meta", { property: "og:url", content: url }],
      ["meta", { property: "og:image", content: image }],
      ["meta", { name: "twitter:card", content: "summary_large_image" }],
      ["meta", { name: "twitter:title", content: title }],
      ["meta", { name: "twitter:description", content: description }],
      ["meta", { name: "twitter:image", content: image }],
    ];

    if (
      pageData.relativePath.startsWith("blog/") &&
      pageData.relativePath !== "blog/index.md"
    ) {
      const dateInSlug = pageData.relativePath.match(/^blog\/(\d{4}-\d{2}-\d{2})-/);
      const datePublished = pageData.frontmatter.date || dateInSlug?.[1];
      const authorNames = pageData.frontmatter.authors;
      const author = Array.isArray(authorNames)
        ? authorNames.map((name: string) => ({ "@type": "Person", name }))
        : [{ "@type": "Organization", name: "Fontist" }];

      tags.push([
        "script",
        { type: "application/ld+json" },
        JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          description,
          ...(datePublished ? { datePublished } : {}),
          author,
          image,
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
        }),
      ]);
    }

    return tags;
  },

  themeConfig: {
    logo: "/logo-full.svg",
    siteTitle: false,

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: "Fontist",
        link: "https://www.fontist.org/fontist/",
        target: "_self",
      },
      {
        text: "Fontisan",
        link: "https://www.fontist.org/fontisan/",
        target: "_self",
      },
      {
        text: "Formulas",
        link: "https://www.fontist.org/formulas/",
        target: "_self",
      },
      { text: "Blog", link: "/blog/" },
      {
        text: "Integrations",
        items: [
          { text: "GitHub Actions", link: "/integrations/github-actions/" }
        ]
      },
      { text: "About", link: "/about/" },
    ],

    // sidebar: {},

    socialLinks: [
      { icon: "github", link: "https://github.com/fontist/fontist.github.io" },
    ],

    footer: {
      message: `Fontist is <a href="https://open.ribose.com/">riboseopen</a>`,
      copyright: `Copyright &copy; 2026 Ribose Group Inc. All rights reserved.`,
    },
  },
});
