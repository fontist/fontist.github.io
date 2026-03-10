import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: "en-US",

  // https://vitepress.dev/guide/routing#generating-clean-url
  cleanUrls: true,

  title: "Fontist",
  description: "Install openly-licensed fonts on Windows, Linux and Mac!",

  lastUpdated: true,

  // https://github.com/vuejs/vitepress/issues/3508
  base: process.env.BASE_PATH,

  head: [
    ["link", { rel: "icon", type: "image/png", href: "/favicon-96x96.png", sizes: "96x96" }],
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    ["link", { rel: "shortcut icon", href: "/favicon.ico" }],
    ["link", { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" }],
    ["link", { rel: "manifest", href: "/site.webmanifest" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "Fontist" }],
    [
      "meta",
      {
        property: "og:description",
        content: "Install openly-licensed fonts on Windows, Linux and Mac!",
      },
    ],
    ["meta", { property: "og:image", content: "/logo-full.svg" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
  ],

  themeConfig: {
    logo: "/logo-full.svg",
    siteTitle: false,

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: "Fontist Docs",
        link: "https://fontist.org/fontist/",
        target: "_self",
      },
      {
        text: "Fontisan Docs",
        link: "https://fontist.org/fontisan/",
        target: "_self",
      },
      {
        text: "Formulas",
        link: "https://fontist.org/formulas/",
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
