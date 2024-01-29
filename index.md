---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

features:
  - title: 📄 Fontist
    details: 👩‍💻 Install openly-licensed fonts on Windows, Linux and Mac!
    link: https://fontist.org/fontist/
    linkText: Go to Fontist
  - title: 📦 Formulas
    details: 🔎 Searchable index of all installable Fontist Formulas
    link: https://fontist.org/formulas/
    linkText: Go to Formulas
---

<!-- Honestly this page is REALY CLOSE to just being a redirect to
https://fontist.org/fontist/ and anyone who wants to access the blog or
other pages of this site can use Google indexing OR direct links from
other pages. 🤷‍♂️ -->

<style>
  .VPContent.is-home {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .VPContent.is-home .VPLink .title {
    font-size: 1.5em;
    line-height: 1.46;
  }
  .VPContent.is-home .VPLink .details {
    font-size: 1em;
    line-height: 1.46;
    color: inherit;
  }
</style>

<script setup>
import HomeContent from "./.vitepress/theme/components/HomeContent.vue"
</script>

<HomeContent align=center>
<br />

[📚 Also check out our blog](/blog/)

</HomeContent>
