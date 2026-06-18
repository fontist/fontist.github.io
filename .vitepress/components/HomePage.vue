<script setup lang="ts">
// Type Specimen homepage.
// The page is treated as a printed type specimen: typography is the design
// engine, the cream/ink palette is "paper", and the rose is the single
// "printer's ink" accent. Palette + dark-mode live in theme/style.css
// under `.specimen-home` (the pageClass set in index.md frontmatter).

const products = [
  {
    num: "01",
    name: "Fontist",
    tag: "Install & Manage",
    role: "A cross-platform font installer.",
    spec: "Win · Linux · macOS · CLI & Ruby API · native OS integration.",
    link: "https://www.fontist.org/fontist/",
    cta: "Open the documentation",
  },
  {
    num: "02",
    name: "Fontisan",
    tag: "Build & Convert",
    role: "Shape, convert, and build fonts.",
    spec: "Pure Ruby · TTF/OTF/WOFF2 · variable · Type 1 · collections.",
    link: "https://www.fontist.org/fontisan/",
    cta: "Open the documentation",
  },
  {
    num: "03",
    name: "Formulas",
    tag: "The Registry",
    role: "A searchable index of formulae.",
    spec: "2,175 formulae · 14,500 styles · openly-licensed · auto-updated.",
    link: "https://www.fontist.org/formulas/",
    cta: "Browse the registry",
  },
];
</script>

<template>
  <div class="specimen">
    <!-- Masthead -->
    <div class="masthead">
      <span class="l">Fontist <span class="dot">●</span></span>
      <span class="c">A Specimen for Cross-Platform Font Management</span>
      <span class="r">Vol. 01 / MMXXVI</span>
    </div>

    <!-- Hero -->
    <section class="hero">
      <div class="ghost-numeral" aria-hidden="true">01</div>
      <div class="wrap">
        <div class="meta-row">
          <span><b>Specimen 01</b> — The Hero</span>
          <span>Set in <b>Fraunces</b>, variable opsz 9–144</span>
        </div>

        <h1>
          <span class="line">
            <span class="word" style="animation-delay:.05s">Fonts</span>
            <span class="word" style="animation-delay:.12s">for</span>
            <span class="word" style="animation-delay:.19s">the</span>
          </span>
          <span class="line">
            <em><span class="word" style="animation-delay:.26s">modern</span></em>
            <span class="word" style="animation-delay:.33s">workflow.</span>
          </span>
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
              <a class="btn-ink" href="https://www.fontist.org/fontist/" target="_self" rel="noreferrer">
                Begin →
              </a>
              <a class="btn-ghost" href="https://www.fontist.org/fontist/" target="_self" rel="noreferrer">
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

    <!-- Products -->
    <section class="section products">
      <div class="wrap">
        <header class="head">
          <div>
            <p class="eyebrow">§ The Instrumentarium</p>
            <h2>Three instruments<br />for the <em>font&nbsp;engineer.</em></h2>
          </div>
          <p class="lede">
            A small family of tools that install, shape, and index openly-licensed type —
            the same way, on every platform, in every pipeline.
          </p>
        </header>

        <div v-for="p in products" :key="p.num" class="plate-row">
          <div class="num">№ {{ p.num }}</div>
          <h3 class="name">
            {{ p.name }}<span class="tag">{{ p.tag }}</span>
          </h3>
          <div class="side">
            <p class="role">{{ p.role }}</p>
            <p class="spec-line">{{ p.spec }}</p>
            <a :href="p.link" target="_self" rel="noreferrer">{{ p.cta }} →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Colophon stats -->
    <section class="section colophon divider">
      <div class="wrap">
        <p>
          Indexed in <span class="n">2,175</span> formulae, spanning
          <span class="n">14,500</span> styles, since <span class="n">MMXX.</span>
        </p>
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
            → <a href="/about/">Read the story behind the project</a>
          </p>
        </div>
      </div>
    </section>

    <!-- Footer colophon -->
    <footer class="foot">
      <span>Set in <em>Fraunces</em>, <em>IBM&nbsp;Plex</em>, &amp; <em>JetBrains&nbsp;Mono</em>.</span>
      <span class="r">Fontist · a Ribose project · © MMXXVI</span>
    </footer>
  </div>
</template>

<style scoped>
/* ── Layout primitives ────────────────────────────────────────── */
.specimen {
  font-family: "IBM Plex Sans", -apple-system, system-ui, sans-serif;
  color: var(--spec-ink);
  background-color: var(--spec-paper);
  overflow-x: hidden;
}
.wrap {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 clamp(20px, 4vw, 56px);
}
.section {
  padding: clamp(64px, 11vw, 140px) 0;
}
.divider {
  border-top: 1px solid var(--spec-rule);
}

/* paper grain overlay */
.specimen::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
  opacity: 0.045;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  mix-blend-mode: multiply;
}

/* ── Masthead ─────────────────────────────────────────────────── */
.masthead {
  border-bottom: 1px solid var(--spec-rule);
  padding: 14px clamp(20px, 4vw, 56px);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--spec-ink-soft);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: center;
}
.masthead .l { justify-self: start; }
.masthead .c { justify-self: center; color: var(--spec-ink); }
.masthead .r { justify-self: end; }
.masthead .dot { color: var(--spec-rose); font-weight: 500; }

/* ── Shared bits ──────────────────────────────────────────────── */
.eyebrow {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--spec-rose);
  margin: 0 0 18px;
}
.lede {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 350;
  font-size: clamp(20px, 2.1vw, 27px);
  line-height: 1.4;
  color: var(--spec-ink-soft);
  max-width: 38ch;
  margin: 0;
}

/* ── Hero ─────────────────────────────────────────────────────── */
.hero {
  position: relative;
  padding-top: clamp(40px, 7vw, 96px);
  padding-bottom: clamp(56px, 9vw, 120px);
  border-bottom: 1px solid var(--spec-rule);
  overflow: hidden;
}
.hero .meta-row {
  display: flex;
  justify-content: space-between;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--spec-mute);
  margin-bottom: clamp(28px, 5vw, 64px);
}
.hero .meta-row b { color: var(--spec-ink); font-weight: 500; }

.hero h1 {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 340;
  font-variation-settings: "opsz" 144;
  font-size: clamp(56px, 13.5vw, 196px);
  line-height: 0.92;
  letter-spacing: -0.025em;
  margin: 0;
  color: var(--spec-ink);
}
.hero h1 .line { display: block; overflow: hidden; }
.hero h1 .word {
  display: inline-block;
  transform: translateY(110%);
  animation: specimen-set 1s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}
.hero h1 em {
  font-style: italic;
  font-weight: 360;
  color: var(--spec-rose);
  font-variation-settings: "opsz" 144, "wght" 380;
}
@keyframes specimen-set {
  to { transform: translateY(0); }
}

.hero .below {
  display: grid;
  grid-template-columns: 1.4fr 0.9fr;
  gap: clamp(32px, 6vw, 88px);
  align-items: end;
  margin-top: clamp(40px, 6vw, 80px);
}
.hero .spec {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.7;
  color: var(--spec-ink-soft);
  letter-spacing: 0.01em;
  margin: 0;
}
.hero .spec .pip { color: var(--spec-rose); padding: 0 0.35em; }
.hero .actions {
  display: flex;
  gap: 26px;
  align-items: baseline;
  margin-top: 28px;
  flex-wrap: wrap;
}
.btn-ink {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--spec-paper);
  background: var(--spec-ink);
  padding: 14px 22px;
  text-decoration: none;
  display: inline-flex;
  gap: 10px;
  align-items: center;
  transition: background 0.25s ease;
}
.btn-ink:hover { background: var(--spec-rose); }
.btn-ghost {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--spec-ink);
  text-decoration: none;
  border-bottom: 1px solid var(--spec-rule-strong);
  padding: 6px 0;
  transition: color 0.2s, border-color 0.2s;
}
.btn-ghost:hover { color: var(--spec-rose); border-color: var(--spec-rose); }

/* terminal specimen plate */
.plate {
  background: var(--spec-term-bg);
  color: var(--spec-term-ink);
  padding: 22px 24px 26px;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.85;
  position: relative;
  box-shadow: 18px 18px 0 -1px var(--spec-paper-deep),
    18px 18px 0 var(--spec-rule);
}
.plate::before {
  content: "SPECIMEN PLATE — LIVE";
  position: absolute;
  top: -11px;
  left: 18px;
  background: var(--spec-paper);
  color: var(--spec-rose);
  font-size: 10px;
  letter-spacing: 0.2em;
  padding: 2px 8px;
  border: 1px solid var(--spec-rule);
}
.plate .prompt { color: var(--spec-rose-soft); }
.plate .ok { color: #8fb98a; }
.plate .out { color: var(--spec-term-ink); opacity: 0.78; }

/* ghost numeral */
.hero .ghost-numeral {
  position: absolute;
  right: -2vw;
  bottom: -8vw;
  font-family: "Fraunces", Georgia, serif;
  font-weight: 300;
  font-style: italic;
  font-size: 42vw;
  line-height: 1;
  color: var(--spec-ink);
  opacity: 0.035;
  pointer-events: none;
  user-select: none;
}
.hero .wrap { position: relative; z-index: 1; }

/* ── Products ─────────────────────────────────────────────────── */
.products .head {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: end;
  margin-bottom: clamp(48px, 8vw, 104px);
}
.products h2 {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 340;
  font-size: clamp(36px, 5.4vw, 76px);
  line-height: 0.98;
  letter-spacing: -0.02em;
  margin: 0;
}
.products h2 em { font-style: italic; color: var(--spec-rose); }

.plate-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: clamp(28px, 5vw, 72px);
  align-items: baseline;
  padding: clamp(36px, 5vw, 64px) 0;
  border-top: 1px solid var(--spec-rule);
}
.plate-row:last-of-type { border-bottom: 1px solid var(--spec-rule); }
.plate-row .num {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 13px;
  letter-spacing: 0.14em;
  color: var(--spec-rose);
}
.plate-row .name {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 340;
  font-size: clamp(48px, 8.5vw, 128px);
  line-height: 0.95;
  letter-spacing: -0.025em;
  margin: 0;
  font-variation-settings: "opsz" 144;
  transition: font-variation-settings 0.5s ease, color 0.3s;
}
.plate-row .name .tag {
  display: block;
  font-family: "Fraunces", Georgia, serif;
  font-style: italic;
  font-weight: 360;
  font-size: 0.42em;
  color: var(--spec-rose);
  margin-top: 0.18em;
  letter-spacing: 0;
}
.plate-row:hover .name {
  font-variation-settings: "opsz" 144, "wght" 460;
  color: var(--spec-rose);
}
.plate-row .side {
  text-align: right;
  max-width: 26ch;
}
.plate-row .side .role {
  font-family: "Fraunces", Georgia, serif;
  font-style: italic;
  font-weight: 380;
  font-size: clamp(17px, 1.6vw, 22px);
  color: var(--spec-ink);
  margin: 0 0 10px;
}
.plate-row .side .spec-line {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--spec-mute);
  margin: 0;
}
.plate-row .side a {
  display: inline-block;
  margin-top: 14px;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--spec-ink);
  text-decoration: none;
  border-bottom: 1px solid var(--spec-rule-strong);
  padding-bottom: 2px;
}
.plate-row .side a:hover { color: var(--spec-rose); border-color: var(--spec-rose); }

/* ── Colophon stats ───────────────────────────────────────────── */
.colophon { text-align: center; }
.colophon p {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 330;
  font-size: clamp(26px, 4vw, 56px);
  line-height: 1.25;
  letter-spacing: -0.015em;
  margin: 0 auto;
  max-width: 22ch;
  color: var(--spec-ink);
}
.colophon p .n {
  font-style: italic;
  color: var(--spec-rose);
  font-variation-settings: "opsz" 144, "wght" 420;
}

/* ── Why / story ──────────────────────────────────────────────── */
.story-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: clamp(40px, 6vw, 96px);
}
.story .label {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--spec-rose);
  margin: 0;
}
.story .body p {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 360;
  font-size: clamp(19px, 1.9vw, 25px);
  line-height: 1.55;
  color: var(--spec-ink-soft);
  margin: 0 0 1.2em;
}
.story .body p:first-child::first-letter {
  font-family: "Fraunces", Georgia, serif;
  font-style: italic;
  font-weight: 460;
  font-size: 4.6em;
  float: left;
  line-height: 0.82;
  padding: 0.06em 0.12em 0 0;
  color: var(--spec-rose);
  font-variation-settings: "opsz" 144, "wght" 520;
}
.story .body .signoff {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--spec-mute);
  margin-top: 2em;
}
.story .body .signoff a {
  color: var(--spec-ink);
  border-bottom: 1px solid var(--spec-rule-strong);
  text-decoration: none;
  padding-bottom: 2px;
}
.story .body .signoff a:hover { color: var(--spec-rose); border-color: var(--spec-rose); }

/* ── Footer colophon ──────────────────────────────────────────── */
.foot {
  border-top: 1px solid var(--spec-rule);
  padding: 40px clamp(20px, 4vw, 56px) 56px;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--spec-mute);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.foot .r { text-align: right; }
.foot em {
  font-family: "Fraunces", Georgia, serif;
  font-style: italic;
  text-transform: none;
  letter-spacing: 0;
  color: var(--spec-ink-soft);
}

/* ── Responsive ───────────────────────────────────────────────── */
@media (max-width: 860px) {
  .hero .below { grid-template-columns: 1fr; }
  .products .head { grid-template-columns: 1fr; }
  .plate-row { grid-template-columns: 1fr; gap: 14px; }
  .plate-row .side { text-align: left; }
  .story-grid { grid-template-columns: 1fr; }
  .foot { grid-template-columns: 1fr; }
  .foot .r { text-align: left; }
  .masthead { grid-template-columns: 1fr; text-align: center; }
  .masthead .l, .masthead .r { justify-self: center; }
}
</style>
