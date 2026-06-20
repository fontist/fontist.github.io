<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
// Type Specimen homepage.
// Two distinct ideas, kept distinct:
//  - SPECIMENS  → real typefaces (fonts you can install via Fontist), shown
//                 at display size in their own face. This is the genuine
//                 specimen move — "type, ready to install."
//  - INSTRUMENTS → Fontist / Fontisan / Formulas, the *software tools*,
//                  presented functionally (NOT as type samples).
// The site-wide palette/typography system lives in theme/style.css.

const specimens = [
  {
    name: "Newsreader",
    cssFamily: "'Fraunces', Georgia, serif",
    install: 'fontist install "Newsreader"',
    note: "Display serif · variable opsz",
  },
  {
    name: "Roboto",
    cssFamily: "'Roboto', sans-serif",
    install: 'fontist install "Roboto"',
    note: "Neo-grotesque · 6 styles",
  },
  {
    name: "IBM Plex Sans",
    cssFamily: "'IBM Plex Sans', sans-serif",
    install: 'fontist install "IBM Plex Sans"',
    note: "Grotesque · 7 styles",
  },
  {
    name: "Source Serif 4",
    cssFamily: "'Source Serif 4', Georgia, serif",
    install: 'fontist install "Source Serif"',
    note: "Workhorse serif · variable",
  },
  {
    name: "JetBrains Mono",
    cssFamily: "'JetBrains Mono', monospace",
    install: 'fontist install "JetBrains Mono"',
    note: "Mono · 8 styles",
  },
];

const instruments = [
  {
    num: "01",
    name: "Fontist",
    role: "Install & manage fonts across Windows, Linux, and macOS — one command, native OS integration.",
    spec: "CLI & Ruby API",
    link: "https://www.fontist.org/fontist/",
    cta: "Documentation",
  },
  {
    num: "02",
    name: "Fontisan",
    role: "Build, convert, and shape fonts programmatically — pure Ruby, every modern format.",
    spec: "TTF · OTF · WOFF2 · variable",
    link: "https://www.fontist.org/fontisan/",
    cta: "Documentation",
  },
  {
    num: "03",
    name: "Formulas",
    role: "A searchable registry of openly-licensed font formulae, auto-updated.",
    spec: "2,175 formulae · 14,500 styles",
    link: "https://www.fontist.org/formulas/",
    cta: "Browse",
  },
];

const motds = [
  "Installing fonts so humanity doesn't have to.",
  "2,175 openly-licensed typefaces. One command. Zero headaches.",
  "Making type accessible — because everyone deserves good fonts.",
  "Stop worrying about fonts. We already did.",
  "The font pipeline that runs while you sleep.",
  "Automating typography for a more beautiful web.",
];
const motdText = ref("");
const motdIndex = ref(0);
let typeTimer: ReturnType<typeof setTimeout> | null = null;

function typeMotd() {
  const msg = motds[motdIndex.value];
  let i = 0;
  motdText.value = "";
  (function step() {
    if (i < msg.length) {
      motdText.value = msg.slice(0, ++i);
      typeTimer = setTimeout(step, 30 + Math.random() * 45);
    } else {
      typeTimer = setTimeout(eraseMotd, 3800);
    }
  })();
}
function eraseMotd() {
  (function step() {
    if (motdText.value.length > 0) {
      motdText.value = motdText.value.slice(0, -1);
      typeTimer = setTimeout(step, 18);
    } else {
      motdIndex.value = (motdIndex.value + 1) % motds.length;
      typeTimer = setTimeout(typeMotd, 350);
    }
  })();
}
function skipMotd() {
  if (typeTimer) clearTimeout(typeTimer);
  motdText.value = "";
  motdIndex.value = (motdIndex.value + 1) % motds.length;
  typeMotd();
}
onMounted(typeMotd);
onUnmounted(() => { if (typeTimer) clearTimeout(typeTimer); });
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

        <p class="motd" @click="skipMotd" title="Click for next message">
          <span class="motd-text">{{ motdText }}</span><span class="motd-cursor"></span>
        </p>

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

    <!-- The Instruments: the TOOLS (first — this is what visitors need) -->
    <section class="section instruments">
      <div class="wrap">
        <header class="head">
          <div>
            <p class="eyebrow">§ The Instruments</p>
            <h2>Three tools.<br />One <em>pipeline.</em></h2>
          </div>
          <p class="lede">
            The software that sources, shapes, and indexes the type — small, discrete,
            and designed to compose.
          </p>
        </header>

        <div class="inst-grid">
          <div v-for="t in instruments" :key="t.num" class="inst-card">
            <div class="inst-num">{{ t.num }}</div>
            <h3 class="inst-name">{{ t.name }}</h3>
            <p class="inst-role">{{ t.role }}</p>
            <p class="inst-spec">{{ t.spec }}</p>
            <a class="inst-link" :href="t.link" target="_self" rel="noreferrer">{{ t.cta }} →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Specimens: a compact reference of available type (secondary) -->
    <section class="section specimens divider">
      <div class="wrap">
        <header class="head">
          <div>
            <p class="eyebrow">§ Specimens</p>
            <h2>Available<br />type.</h2>
          </div>
          <p class="lede">
            A small sample from the registry of 2,175 openly-licensed typefaces.
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
.specimen {
  color: var(--spec-ink);
  background-color: var(--spec-paper);
  overflow-x: hidden;
}
.wrap {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 clamp(20px, 4vw, 56px);
}
.section { padding: clamp(64px, 11vw, 140px) 0; }
.divider { border-top: 1px solid var(--spec-rule); }

/* Masthead */
.masthead {
  border-bottom: 1px solid var(--spec-rule);
  padding: 14px clamp(20px, 4vw, 56px);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--spec-ink-soft);
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
}
.masthead .c { color: var(--spec-ink); }

/* Shared */
.eyebrow {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--spec-rose);
  margin: 0 0 18px;
}
.lede {
  font-family: "Newsreader", Georgia, serif;
  font-weight: 350;
  font-size: clamp(19px, 2vw, 25px);
  line-height: 1.4;
  color: var(--spec-ink-soft);
  max-width: 40ch;
  margin: 0;
}
.head {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: end;
  margin-bottom: clamp(48px, 8vw, 96px);
}
.head h2 {
  font-family: "Newsreader", Georgia, serif;
  font-weight: 340;
  font-size: clamp(34px, 5vw, 68px);
  line-height: 0.98;
  letter-spacing: -0.022em;
  margin: 0;
  color: var(--spec-ink);
}
.head h2 em { font-style: italic; color: var(--spec-rose); }
.prompt { color: var(--spec-rose-soft); }

/* Hero */
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
  font-family: "Newsreader", Georgia, serif;
  font-weight: 340;
  font-variation-settings: "opsz" 144;
  font-size: clamp(56px, 13.5vw, 196px);
  line-height: 0.92;
  letter-spacing: -0.025em;
  margin: 0;
}
.hero h1 .line { display: block; overflow: hidden; padding-top: 0.12em; }
.hero h1 .word {
  display: inline-block;
  margin-right: 0.25em;
  transform: translateY(110%);
  animation: specimen-set 1s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}
.hero h1 em {
  font-style: italic;
  color: var(--spec-rose);
  font-variation-settings: "opsz" 144, "wght" 380;
}
@keyframes specimen-set { to { transform: translateY(0); } }

.motd {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: clamp(14px, 1.5vw, 18px);
  color: var(--spec-ink-soft);
  margin: clamp(20px, 3vw, 32px) 0 0;
  cursor: pointer;
  user-select: none;
  min-height: 1.6em;
  transition: color 0.2s;
}
.motd:hover { color: var(--spec-ink); }
.motd-cursor {
  display: inline-block;
  width: 9px;
  height: 1.05em;
  background: var(--spec-rose);
  margin-left: 3px;
  vertical-align: text-bottom;
  animation: motd-blink 1.06s steps(1) infinite;
}
@keyframes motd-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
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
.plate {
  background: var(--spec-term-bg);
  color: var(--spec-term-ink);
  padding: 22px 24px 26px;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.85;
  position: relative;
  box-shadow: 18px 18px 0 -1px var(--spec-paper-deep), 18px 18px 0 var(--spec-rule);
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
.plate .ok { color: #8fb98a; }
.plate .out { opacity: 0.78; }
.hero .ghost-numeral {
  position: absolute;
  right: -2vw;
  bottom: -8vw;
  font-family: "Newsreader", Georgia, serif;
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

/* Specimens: real typefaces, large, in their own face */
.spec-list { list-style: none; margin: 0; padding: 0; }
.spec-row {
  padding: clamp(12px, 1.5vw, 18px) 0;
  border-top: 1px solid var(--spec-rule);
}
.spec-row:last-child { border-bottom: 1px solid var(--spec-rule); }
.spec-sample {
  font-size: clamp(22px, 2.5vw, 34px);
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: var(--spec-ink);
  margin-bottom: 0.1em;
  transition: color 0.3s ease;
}
.spec-row:hover .spec-sample { color: var(--spec-rose); }
.spec-detail {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--spec-mute);
}
.spec-detail .cmd { color: var(--spec-ink-soft); }
.spec-detail .sep { color: var(--spec-rose); padding: 0 0.5em; }

/* Instruments: the tools — functional, restrained */
.inst-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--spec-rule);
  border: 1px solid var(--spec-rule);
}
.inst-card {
  background: var(--spec-paper);
  padding: clamp(28px, 3.5vw, 44px);
  display: flex;
  flex-direction: column;
}
.inst-num {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 12px;
  letter-spacing: 0.14em;
  color: var(--spec-rose);
  margin-bottom: 18px;
}
.inst-name {
  font-family: "Newsreader", Georgia, serif;
  font-weight: 360;
  font-variation-settings: "opsz" 72;
  font-size: clamp(28px, 3vw, 38px);
  letter-spacing: -0.02em;
  margin: 0 0 14px;
  color: var(--spec-ink);
}
.inst-role {
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--spec-ink-soft);
  margin: 0 0 16px;
  flex: 1;
}
.inst-spec {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--spec-mute);
  margin: 0 0 20px;
}
.inst-link {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--spec-ink);
  text-decoration: none;
  border-bottom: 1px solid var(--spec-rule-strong);
  padding-bottom: 2px;
  align-self: flex-start;
  transition: color 0.2s, border-color 0.2s;
}
.inst-link:hover { color: var(--spec-rose); border-color: var(--spec-rose); }

/* Colophon */
.colophon { text-align: center; }
.colophon p {
  font-family: "Newsreader", Georgia, serif;
  font-weight: 330;
  font-size: clamp(24px, 3.6vw, 48px);
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

/* Story */
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
  font-family: "Newsreader", Georgia, serif;
  font-weight: 360;
  font-size: clamp(18px, 1.8vw, 23px);
  line-height: 1.55;
  color: var(--spec-ink-soft);
  margin: 0 0 1.2em;
}
.story .body p:first-child::first-letter {
  font-family: "Newsreader", Georgia, serif;
  font-style: italic;
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

/* Footer */
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
  font-family: "Newsreader", Georgia, serif;
  font-style: italic;
  text-transform: none;
  letter-spacing: 0;
  color: var(--spec-ink-soft);
}

@media (max-width: 860px) {
  .hero .below { grid-template-columns: 1fr; }
  .head { grid-template-columns: 1fr; }
  .inst-grid { grid-template-columns: 1fr; }
  .story-grid { grid-template-columns: 1fr; }
  .foot { grid-template-columns: 1fr; }
  .foot .r { text-align: left; }
  .masthead { grid-template-columns: 1fr; text-align: center; }
  .masthead .l, .masthead .r { justify-self: center; }
}
</style>
