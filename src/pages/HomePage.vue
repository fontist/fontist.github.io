<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref } from 'vue'
import { useHead } from '@unhead/vue'
import { loadAllFormulas } from '../lib/formulas/loader'

const formulaCount = ref(0)

try {
  const data = await loadAllFormulas()
  formulaCount.value = data.length
} catch {}

useHead({
  title: 'Fontist — Install fonts anywhere',
  meta: [
    { name: 'description', content: 'Install, manage, and explore openly-licensed fonts across Windows, Linux, and macOS. Open-source font manager for developers.' },
    { property: 'og:title', content: 'Fontist — Install fonts anywhere' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://www.fontist.org/' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
  link: [
    { rel: 'canonical', href: 'https://www.fontist.org/' },
  ],
})
</script>

<template>
  <div class="home">
    <section class="hero">
      <h1 class="hero-title">Fontist</h1>
      <p class="hero-subtitle">
        Install, manage, and explore {{ formulaCount > 0 ? formulaCount.toLocaleString() : '4,280+' }}
        openly-licensed fonts across Windows, Linux, and macOS.
      </p>
      <div class="hero-cta">
        <RouterLink to="/browse" class="cta-primary">Browse fonts →</RouterLink>
        <RouterLink to="/unicode" class="cta-secondary">Unicode browser</RouterLink>
      </div>
    </section>

    <section class="features">
      <RouterLink to="/browse" class="feature-card">
        <h3>Browse Formulas</h3>
        <p>Search {{ formulaCount > 0 ? formulaCount.toLocaleString() : '4,280+' }} font formulas by name, license, or platform.</p>
      </RouterLink>
      <RouterLink to="/unicode" class="feature-card">
        <h3>Unicode Browser</h3>
        <p>Explore Unicode 16.0 — planes, blocks, characters, scripts, and categories.</p>
      </RouterLink>
      <RouterLink to="/guide" class="feature-card">
        <h3>Guide</h3>
        <p>Learn about fonts, formulas, and how to use Fontist in your projects.</p>
      </RouterLink>
      <RouterLink to="/licenses" class="feature-card">
        <h3>Licenses</h3>
        <p>Understand font licenses — OFL, Apache, MIT, and what they permit.</p>
      </RouterLink>
    </section>

    <section class="tools">
      <div class="tool">
        <h3>Fontist CLI</h3>
        <p>Cross-platform font installer. <code>gem install fontist</code></p>
        <a href="https://github.com/fontist/fontist">GitHub →</a>
      </div>
      <div class="tool">
        <h3>Fontisan</h3>
        <p>Font processing library for Ruby. Subset, convert, analyze.</p>
        <a href="https://github.com/fontist/fontisan">GitHub →</a>
      </div>
      <div class="tool">
        <h3>Formulas</h3>
        <p>{{ formulaCount > 0 ? formulaCount.toLocaleString() : '4,280+' }} font formula files. The data behind it all.</p>
        <a href="https://github.com/fontist/formulas">GitHub →</a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.hero { text-align: center; padding: 4rem 0 3rem; }
.hero-title { font-size: clamp(3rem, 8vw, 5rem); font-weight: 800; letter-spacing: -0.03em; margin: 0 0 1rem; color: #1a1a1a; }
.hero-subtitle { font-size: 1.2rem; line-height: 1.5; color: #555; max-width: 600px; margin: 0 auto 2rem; }
.hero-cta { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
.cta-primary { padding: 0.7rem 1.5rem; background: #bf4e6a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.95rem; transition: opacity 0.15s; }
.cta-primary:hover { opacity: 0.85; }
.cta-secondary { padding: 0.7rem 1.5rem; border: 1px solid #e8e6e0; color: #555; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 0.95rem; transition: all 0.15s; }
.cta-secondary:hover { border-color: #bf4e6a; color: #bf4e6a; }

.features { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 3rem; }
.feature-card { padding: 1.5rem; background: #faf8f5; border: 1px solid #e8e6e0; border-radius: 8px; text-decoration: none; transition: all 0.15s; }
.feature-card:hover { border-color: #bf4e6a; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.feature-card h3 { margin: 0 0 0.5rem; font-size: 1.05rem; color: #1a1a1a; }
.feature-card p { margin: 0; font-size: 0.85rem; line-height: 1.4; color: #777; }

.tools { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
.tool { padding: 1.5rem; border-left: 3px solid #bf4e6a; }
.tool h3 { margin: 0 0 0.3rem; font-size: 1rem; color: #1a1a1a; }
.tool p { margin: 0 0 0.5rem; font-size: 0.85rem; color: #777; }
.tool code { font-family: monospace; font-size: 0.8rem; background: #f6f6f7; padding: 0.1em 0.3em; border-radius: 3px; }
.tool a { font-size: 0.82rem; color: #bf4e6a; text-decoration: none; }
.tool a:hover { text-decoration: underline; }
</style>
