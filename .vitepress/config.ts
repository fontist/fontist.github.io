import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  // FIXME
  ignoreDeadLinks: true,

  // https://vitepress.dev/guide/routing#generating-clean-url
  // ✅ Works with GitHub Pages.
  cleanUrls: true,

  title: "Fontist",
  description: "Install openly-licensed fonts on Windows, Linux and Mac!",

  base: process.env.BASE_PATH,

  themeConfig: {
    logo: "/logo.png",

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Fontist", link: "https://fontist.org/fontist/", target: "_self" },
      { text: "Formulas", link: "https://fontist.org/formulas/", target: "_self" },
      { text: "Blog", link: "/blog/" },
    ],

    // sidebar: {},

    socialLinks: [
      { icon: "github", link: "https://github.com/fontist/fontist.github.io" },
    ],
    
    footer: {
      message: `Fontist is <a href="https://open.ribose.com/">riboseopen</a>`,
      copyright: `Copyright &copy; 2023 Ribose Group Inc. All rights reserved.`,
    },
  },
});
