<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useHead } from '@unhead/vue'
import { RouterLink } from 'vue-router'
import { loadAllFormulas } from '../lib/formulas/loader'
import { fetchJson } from '../lib/ssr-fetch'

// Type Specimen homepage.
// Two distinct ideas, kept distinct:
//  - SPECIMENS  → real typefaces (fonts you can install via Fontist), shown
//                 at display size in their own face. This is the genuine
//                 specimen move — "type, ready to install."
//  - INSTRUMENTS → Fontist / Fontisan / Formulas, the *software tools*,
//                  presented functionally (NOT as type samples).
// The site-wide palette/typography system lives in styles/main.css.

const formulaCount = ref(0)
const openSourceCount = ref(0)
const openLicenseBuckets = ref<{ label: string; count: number; score: number }[]>([])
const propLicenseBuckets = ref<{ label: string; count: number; score: number }[]>([])
const recentPosts = ref<{ slug: string; title: string; date: string; description?: string }[]>([])

// Canonical license bucketing — collapses the long tail of licenseName
// variants into a small set of human-readable groups. Microsoft and
// Adobe each consolidate their LICENSEREF-* family into one row.
//
// `open_source` formulas (per licenseCategory) feed the positive
// top-of-chart rows; everything else (platform_restricted,
// bundled_software, freely_distributable) lands in the muted
// proprietary block at the bottom.
const OPEN_MATCHERS: { label: string; test: (n: string) => boolean }[] = [
  { label: 'SIL Open Font License',          test: n => n.includes('open font license') || n === 'ofl' || n.startsWith('ofl-1') },
  { label: 'Apache License 2.0',             test: n => n.includes('apache') },
  { label: 'IPA Font License',               test: n => n.includes('ipa font') },
  { label: 'CC0 / Public Domain',            test: n => n.includes('creative commons zero') || n.includes('cc0') || n.includes('public domain') || n.includes('publicdomain') },
  { label: 'Ubuntu Font Licence',            test: n => n.includes('ubuntu font') },
  { label: 'GNU GPL (with Font Exception)',  test: n => n.includes('gnu gpl') || n.includes('lppl') },
]
const PROP_MATCHERS: { label: string; test: (n: string) => boolean }[] = [
  { label: 'Apple-only',     test: n => n.includes('apple') },
  { label: 'Microsoft',      test: n => n.includes('microsoft') },
  { label: 'Adobe',          test: n => n.includes('adobe') },
]

function normLicenseName(raw: string | undefined): string {
  return (raw || 'Unknown').replace(/^LICENSEREF-/i, '').toLowerCase()
}

async function loadStats() {
  try {
    const all = await loadAllFormulas()
    formulaCount.value = all.length
    openSourceCount.value = all.filter((f) => f.licenseCategory === 'open_source').length

    const openCounts = new Map<string, number>()
    const propCounts = new Map<string, number>()
    let openOther = 0
    let propOther = 0

    for (const f of all) {
      const name = normLicenseName(f.licenseName)
      const isOpen = f.licenseCategory === 'open_source'
      if (isOpen) {
        const hit = OPEN_MATCHERS.find(m => m.test(name))
        if (hit) openCounts.set(hit.label, (openCounts.get(hit.label) ?? 0) + 1)
        else openOther++
      } else {
        const hit = PROP_MATCHERS.find(m => m.test(name))
        if (hit) propCounts.set(hit.label, (propCounts.get(hit.label) ?? 0) + 1)
        else propOther++
      }
    }

    const toBuckets = (entries: [string, number][], other: number, otherLabel: string) => {
      const list = entries
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
      if (other > 0) list.push({ label: otherLabel, count: other })
      const max = Math.max(...list.map(b => b.count), 1)
      return list.map(b => ({ ...b, score: Math.round((b.count / max) * 100) }))
    }

    openLicenseBuckets.value = toBuckets([...openCounts.entries()], openOther, 'Other open source')
    propLicenseBuckets.value = toBuckets([...propCounts.entries()], propOther, 'Other proprietary')
  } catch {}

  try {
    recentPosts.value = await fetchJson<typeof recentPosts.value>('content/blog/index.json')
  } catch {}
}

await loadStats()

const specimens = [
  {
    name: 'Spectral',
    cssFamily: "'Spectral', Georgia, serif",
    install: 'fontist install "Spectral"',
    note: 'Display serif · variable opsz',
  },
  {
    name: 'Roboto',
    cssFamily: "'Roboto', sans-serif",
    install: 'fontist install "Roboto"',
    note: 'Neo-grotesque · 6 styles',
  },
  {
    name: 'IBM Plex Sans',
    cssFamily: "'IBM Plex Sans', sans-serif",
    install: 'fontist install "IBM Plex Sans"',
    note: 'Grotesque · 7 styles',
  },
  {
    name: 'Source Serif 4',
    cssFamily: "'Source Serif 4', Georgia, serif",
    install: 'fontist install "Source Serif"',
    note: 'Workhorse serif · variable',
  },
  {
    name: 'JetBrains Mono',
    cssFamily: "'JetBrains Mono', monospace",
    install: 'fontist install "JetBrains Mono"',
    note: 'Mono · 8 styles',
  },
]

const instruments = [
  {
    num: '01',
    name: 'Fontist',
    role: 'Powered by Fontisan. Installs and manages fonts from a library of ' +
      ' openly-licensed typefaces — across Windows, Linux, and macOS.',
    spec: 'CLI & Ruby API · formulae registry',
    link: 'https://www.fontist.org/fontist/',
    cta: 'Documentation',
  },
  {
    num: '02',
    name: 'Fontisan',
    role: 'The most comprehensive open-source font processor — pure Ruby, every major format from legacy Type 1 to modern WOFF2, from Apple DFONT to web SVG.',
    spec: 'TTF · OTF · WOFF/WOFF2 · Type 1 · TTC/OTC · DFONT · SVG · variable',
    link: 'https://www.fontist.org/fontisan/',
    cta: 'Documentation',
  },
  {
    num: '03',
    name: 'Formulas',
    role: 'A searchable registry of openly-licensed font formulae — featuring type from Google, SIL, IBM, Adobe, and independent foundries. Auto-updated.',
    spec: 'formulae · openly-licensed',
    link: 'https://www.fontist.org/formulas/',
    cta: 'Browse',
  },
]

const motds = [
  'Installing fonts so humanity doesn’t have to.',
  'One command. Thousands of typefaces.',
  'Stop worrying about fonts. We already did.',
  'Making type accessible for everyone.',
  'The font pipeline that runs while you sleep.',
  'Automating typography for a better web.',
]
const motdText = ref('')
const motdIndex = ref(0)
let typeTimer: ReturnType<typeof setTimeout> | null = null

function typeMotd() {
  const msg = motds[motdIndex.value]
  let i = 0
  motdText.value = ''
  ;(function step() {
    if (i < msg.length) {
      motdText.value = msg.slice(0, ++i)
      typeTimer = setTimeout(step, 30 + Math.random() * 45)
    } else {
      typeTimer = setTimeout(eraseMotd, 3800)
    }
  })()
}
function eraseMotd() {
  ;(function step() {
    if (motdText.value.length > 0) {
      motdText.value = motdText.value.slice(0, -1)
      typeTimer = setTimeout(step, 18)
    } else {
      motdIndex.value = (motdIndex.value + 1) % motds.length
      typeTimer = setTimeout(typeMotd, 350)
    }
  })()
}
function skipMotd() {
  if (typeTimer) clearTimeout(typeTimer)
  motdText.value = ''
  motdIndex.value = (motdIndex.value + 1) % motds.length
  typeMotd()
}
onMounted(typeMotd)
onUnmounted(() => { if (typeTimer) clearTimeout(typeTimer) })

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
  <div class="specimen">
    <!-- Masthead -->
    <div class="masthead">
      <span class="c">A Specimen for Cross-Platform Font Management</span>
      <span class="r">Vol. 01 / MMXXVI</span>
    </div>

    <!-- Hero -->
    <section class="hero">
      <div class="ghost-numeral" aria-hidden="true">01</div>
      <div class="wrap">
        <h1 class="hero-motd" @click="skipMotd" title="Click for next message">
          {{ motdText }}<span class="motd-cursor"></span>
        </h1>

        <div class="below">
          <div>
            <p class="spec">
              Install <span class="pip">·</span> Manage <span class="pip">·</span> Build
              <span class="pip">—</span> Windows <span class="pip">·</span> Linux
              <span class="pip">·</span> macOS<br />
              Openly-licensed. Programmatic. Built for automated publishing &amp; CI/CD.
            </p>
            <div class="actions">
              <a class="btn-ink" href="https://www.fontist.org/fontist/" rel="noreferrer">
                Begin →
              </a>
              <a class="btn-ghost" href="https://www.fontist.org/fontist/" rel="noreferrer">
                Read the documentation
              </a>
            </div>
          </div>

          <div class="plate" aria-label="Terminal specimen">
            <div><span class="prompt">$</span> gem install fontist fontisan</div>
            <div><span class="prompt">$</span> fontist install "Roboto"</div>
            <div>&nbsp;&nbsp;<span class="ok">✓</span> <span class="out">installed → ~/.fontist/fonts/</span></div>
            <div>
              <span class="prompt">$</span> fontisan convert --to woff2 \<br />
              &nbsp;&nbsp;&nbsp;&nbsp;~/.fontist/fonts/Roboto-Regular.ttf
            </div>
            <div>&nbsp;&nbsp;<span class="ok">✓</span> <span class="out">created Roboto-Regular.woff2</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- The Suite: Fontisan (powerhouse) → Fontist (powered by) → Formulas (registry) -->
    <section class="section instruments">
      <div class="wrap">
        <header class="head">
          <div>
            <h2>Engineer.<br />Manage. <em>Discover.</em></h2>
          </div>
          <p class="lede">
            Fontist installs them across every platform. Fontisan processes every font format.
            Formulas indexes every openly-licensed typeface.
          </p>
        </header>

        <div class="inst-grid">
          <div v-for="t in instruments" :key="t.num" class="inst-card">
            <div class="inst-num">{{ t.num }}</div>
            <h3 class="inst-name">{{ t.name }}</h3>
            <p class="inst-role">{{ t.role }}</p>
            <p class="inst-spec">{{ t.spec }}</p>
            <a class="inst-link" :href="t.link" rel="noreferrer">{{ t.cta }} →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Specimens: a compact reference of available type (secondary) -->
    <section class="section specimens-row divider">
      <div class="wrap">
        <header class="head">
          <div>
            <h2>Available<br />type.</h2>
          </div>
          <p class="lede">
            A small sample from the registry of openly-licensed typefaces.
          </p>
        </header>

        <ul class="spec-list">
          <li v-for="s in specimens" :key="s.name" class="spec-row">
            <div class="spec-sample" :style="{ fontFamily: s.cssFamily }">{{ s.name }}</div>
            <div class="spec-detail">
              <span class="prompt">$</span> <span class="cmd">{{ s.install }}</span>
              <span class="sep">·</span>
              <span class="note">{{ s.note }}</span>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Colophon stats -->
    <section v-if="formulaCount > 0" class="section colophon divider">
      <div class="wrap">
        <p>
          Indexed in <span class="n">{{ formulaCount.toLocaleString() }}</span> formulae —
          <span class="n">{{ openSourceCount.toLocaleString() }}</span> openly licensed — since <span class="n">MMXX.</span>
        </p>
      </div>
    </section>

    <!-- License landscape: visual distribution of the archive -->
    <section v-if="openLicenseBuckets.length > 0" class="section licenses-landscape divider">
      <div class="wrap">
        <header class="head">
          <div>
            <h2>What's in the<br /><em>archive.</em></h2>
          </div>
          <p class="lede">
            A breakdown by license — {{ openSourceCount.toLocaleString() }} openly-licensed
            formulas against a smaller set of platform-restricted and bundled families.
          </p>
        </header>

        <ul class="ll-list">
          <li v-for="b in openLicenseBuckets" :key="'open-' + b.label" class="ll-row ll-row--open">
            <span class="ll-label">{{ b.label }}</span>
            <span class="ll-bar-track" aria-hidden="true">
              <span class="ll-bar-fill ll-bar-fill--open" :style="{ width: Math.max(2, b.score) + '%' }"></span>
            </span>
            <span class="ll-count">{{ b.count.toLocaleString() }}</span>
          </li>
          <li class="ll-separator" aria-hidden="true"></li>
          <li v-for="b in propLicenseBuckets" :key="'prop-' + b.label" class="ll-row ll-row--prop">
            <span class="ll-label">{{ b.label }}</span>
            <span class="ll-bar-track" aria-hidden="true">
              <span class="ll-bar-fill ll-bar-fill--prop" :style="{ width: Math.max(2, b.score) + '%' }"></span>
            </span>
            <span class="ll-count">{{ b.count.toLocaleString() }}</span>
          </li>
        </ul>

        <p class="ll-foot">
          → <RouterLink to="/licenses">Read the license reference</RouterLink>
        </p>
      </div>
    </section>

    <!-- From the blog -->
    <section v-if="recentPosts.length > 0" class="section from-the-blog divider">
      <div class="wrap">
        <header class="head">
          <div>
            <h2>Recent<br /><em>dispatches.</em></h2>
          </div>
          <p class="lede">
            Notes on fonts, tooling, and the occasional specimen book review.
          </p>
        </header>

        <ul class="fb-list">
          <li v-for="post in recentPosts.slice(0, 3)" :key="post.slug" class="fb-item">
            <RouterLink :to="`/blog/${post.slug}`" class="fb-link">
              <span class="fb-date">{{ post.date }}</span>
              <span class="fb-title">{{ post.title }}</span>
              <span v-if="post.description" class="fb-desc">{{ post.description }}</span>
              <span class="fb-arrow" aria-hidden="true">→</span>
            </RouterLink>
          </li>
        </ul>

        <p class="fb-foot">
          → <RouterLink to="/blog">Browse the full journal</RouterLink>
        </p>
      </div>
    </section>

    <!-- Ecosystem companion projects -->
    <section class="section ecosystem divider">
      <div class="wrap">
        <header class="head">
          <div>
            <h2>Beyond the<br /><em>registry.</em></h2>
          </div>
          <p class="lede">
            Two sibling projects extend the Fontist ecosystem — one builds a universal
            Unicode font, the other delivers meteorological symbols.
          </p>
        </header>

        <div class="eco-grid">
          <a href="https://www.essenfont.org" class="eco-card" rel="noreferrer">
            <img src="/logos/essenfont-light.svg" alt="Essenfont" class="eco-card-logo eco-card-logo--light" />
            <img src="/logos/essenfont-dark.svg" alt="Essenfont" class="eco-card-logo eco-card-logo--dark" />
            <span class="eco-card-eyebrow">essenfont.org</span>
            <h3 class="eco-card-name">Essenfont</h3>
            <p class="eco-card-desc">The universal Unicode 17 font. One OFL-licensed typeface covering every assigned codepoint — 131K+ glyphs across 346 blocks and 5 planes. Real vector outlines, not placeholder boxes.</p>
            <span class="eco-card-arrow">→</span>
          </a>
          <a href="https://www.metfont.org" class="eco-card" rel="noreferrer">
            <img src="/logos/metfont-icon.svg" alt="MetFont" class="eco-card-logo" />
            <span class="eco-card-eyebrow">metfont.org</span>
            <h3 class="eco-card-name">MetFont</h3>
            <p class="eco-card-desc">541 WMO and ICAO meteorological symbols as an open-source font. Browse, search, and download every weather glyph — accurate symbols for accurate weather.</p>
            <span class="eco-card-arrow">→</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Why / story -->
    <section class="section story divider">
      <div class="wrap story-grid">
        <div>
          <p class="label">Why Fontist</p>
        </div>
        <div class="body">
          <p>
            Born from the need for cross-platform font management in automated publishing,
            Fontist has become the quiet default for installing openly-licensed type in
            CI/CD pipelines, document engines, and digital presses — without vendoring
            fonts, without manual steps, without surprises across Windows, Linux, and macOS.
          </p>
          <p>
            The instruments are small and discrete by design: one to install, one to shape,
            one to index. Together they treat type the way good presses always have — as
            material to be sourced, prepared, and set with intention.
          </p>
          <p class="signoff">
            → <a href="/about">Read the story behind the project</a>
          </p>
        </div>
      </div>
    </section>

    <!-- Footer colophon -->
    <footer class="foot">
      <span>Set in <em>Spectral</em>, <em>IBM&nbsp;Plex</em>, &amp; <em>JetBrains&nbsp;Mono</em>.</span>
      <span class="r">Fontist · a Ribose project · © MMXXVI</span>
    </footer>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
