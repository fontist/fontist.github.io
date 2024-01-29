---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Fontist"
  tagline: Cross-platform font installer for Windows, Linux and macOS
  actions:
    - theme: brand
      text: Markdown Examples
      link: /markdown-examples
    - theme: alt
      text: API Examples
      link: /api-examples

features:
  - title: Feature A
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - title: Feature B
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - title: Feature C
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
---

<script setup>
import HomeContent from "./.vitepress/theme/components/HomeContent.vue"
</script>

<HomeContent>
<br />

You can get started installing fonts from your CLI right now by installing Fontist through RubyGems:

```sh
gem install fontist
```

💎 Don't have Ruby installed? You can [download Ruby from the official Ruby website](https://www.ruby-lang.org/en/downloads/).

Now you're ready to start using Fontist to install fonts on your machine! 🤩

```sh
fontist install "Fira Code"
fontist install "Open Sans"
fontist install "Consolas"
```

<sup>👩‍⚖️ Some fonts may require you to accept license terms regarding their use.</sup>

📚 Read more on the

</HomeContent>
