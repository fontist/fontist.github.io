import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  // FIXME
  ignoreDeadLinks: true,

  title: "Fontist",
  description: "Install openly-licensed fonts on Windows, Linux and Mac!",

  themeConfig: {
    logo: "/logo.png",

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Fontist", link: "https://fontist.org/fontist/" },
      { text: "Formulas", link: "https://fontist.org/formulas/" },
      { text: "Blog", link: "/blog/" },
    ],

    // sidebar: {},

    socialLinks: [
      { icon: "github", link: "https://github.com/fontist/fontist.github.io" },
    ],

    footer: {
      copyright: `\
Fontist is <a href="https://open.ribose.com/"><img alt="riboseopen" style="display: inline; height: 28px" valign=middle src="${process.env.BASE_PATH || ""}riboseopen.png" /></a><br />
Copyright &copy; 2023 Ribose Group Inc. All rights reserved.<br />
<a href="https://www.ribose.com/tos">Terms of Service</a> | <a href="https://www.ribose.com/privacy">Privacy Policy</a>`,
    },
  },
});
