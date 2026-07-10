<script setup lang="ts">
// PermissionsMatrix — visual answer to "can I do X with this license?".
// Each row is a use case; columns are answer cells. ✅/⚠️/❌ rendered as
// pastel tiles. The header row labels each cell. First column shows the
// use case name + brief description.

type Answer = 'yes' | 'conditional' | 'no'

interface UseCase {
  id: string
  label: string
  detail?: string
}

interface Props {
  // Map of use-case id → answer (yes/conditional/no)
  answers: Record<string, Answer>
}

const props = defineProps<Props>()

// Use cases in canonical order. Each gets a one-line definition.
const USE_CASES: { id: string; label: string; detail: string }[] = [
  { id: 'commercial-static',   label: 'Commercial · static',     detail: 'PDFs, printed materials, logos, packaging' },
  { id: 'commercial-web',      label: 'Commercial · web',        detail: 'Self-hosted webfonts via @font-face' },
  { id: 'commercial-app',      label: 'Commercial · app',        detail: 'Bundled in mobile or desktop software' },
  { id: 'commercial-server',   label: 'Commercial · server',     detail: 'Document generation / SaaS / CI' },
  { id: 'open-source',         label: 'Open-source project',     detail: 'FOSS app or library redistribution' },
  { id: 'modification',        label: 'Modification',            detail: 'Editing glyphs, hinting, custom cuts' },
  { id: 'redistribute',        label: 'Redistribution',          detail: 'Ship the font files to end users' },
  { id: 'standalone-sale',     label: 'Standalone sale',         detail: 'Selling the font itself (not bundled)' },
  { id: 'embed-document',      label: 'Document embedding',      detail: 'PDFs, ePubs, Office files' },
  { id: 'subsetting',          label: 'Subsetting',              detail: 'Stripping glyphs you don\'t need' },
  { id: 'rename',              label: 'Rename',                   detail: 'Removing or changing the font family name' },
  { id: 'attribution',         label: 'Attribution required',    detail: 'Must credit the author in your output' },
]

const ANSWER_LABELS: Record<Answer, string> = {
  yes:          'Allowed',
  conditional:  'With conditions',
  no:           'Not allowed',
}
const ANSWER_SHORT: Record<Answer, string> = {
  yes:          'Yes',
  conditional:  'Cond.',
  no:           'No',
}
const ANSWER_GLYPH: Record<Answer, string> = {
  yes:          '✓',
  conditional:  '◐',
  no:           '✕',
}

function rowAnswer(id: string): Answer {
  return props.answers[id] ?? 'no'
}
</script>

<template>
  <section class="pm">
    <header class="pm-head">
      <h2 class="pm-title">Can I use this license for…</h2>
      <p class="pm-sub">A quick read of the license's permissions and restrictions. Click any cell for the full text below.</p>
    </header>

    <div class="pm-table-wrap">
      <table class="pm-table">
        <thead>
          <tr>
            <th class="pm-th pm-th-label"><span class="pm-sr">Use case</span></th>
            <th
              v-for="answer in (['yes', 'conditional', 'no'] as Answer[])"
              :key="answer"
              :class="['pm-th', `pm-th-${answer}`]"
            >
              <span class="pm-th-glyph" aria-hidden="true">{{ ANSWER_GLYPH[answer] }}</span>
              <span class="pm-th-text">{{ ANSWER_LABELS[answer] }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="uc in USE_CASES" :key="uc.id" class="pm-row">
            <th scope="row" class="pm-rowlabel">
              <span class="pm-rowlabel-l">{{ uc.label }}</span>
              <span class="pm-rowlabel-d">{{ uc.detail }}</span>
            </th>
            <td
              v-for="answer in (['yes', 'conditional', 'no'] as Answer[])"
              :key="answer"
              :class="['pm-cell', `pm-cell--${answer}`, {
                'pm-cell--active': rowAnswer(uc.id) === answer,
              }]"
              :aria-label="`${uc.label}: ${ANSWER_LABELS[answer]}${rowAnswer(uc.id) === answer ? ' (this license)' : ''}`"
            >
              <span v-if="rowAnswer(uc.id) === answer" class="pm-cell-mark" aria-hidden="true">{{ ANSWER_GLYPH[answer] }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="pm-legend">
      <span class="pm-legend-mark pm-legend-mark--yes">✓</span> Allowed outright
      <span class="pm-legend-mark pm-legend-mark--conditional">◐</span> Allowed with conditions (e.g. attribution, share-alike)
      <span class="pm-legend-mark pm-legend-mark--no">✕</span> Not allowed
    </p>
  </section>
</template>

<style scoped>
.pm { margin: 2.5rem 0; }

.pm-head { margin-bottom: 1.5rem; }
.pm-title {
  font-family: var(--spec-font-display);
  font-size: 1.4rem;
  font-style: italic;
  font-weight: 400;
  margin: 0 0 0.25rem;
  color: var(--spec-ink);
}
.pm-sub {
  font-family: var(--spec-font-body);
  font-size: 0.85rem;
  color: var(--spec-ink-soft);
  margin: 0;
  max-width: 60ch;
}

.pm-table-wrap { overflow-x: auto; }

.pm-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: var(--spec-font-mono);
  font-size: 0.78rem;
  min-width: 480px;
}

.pm-th, .pm-cell {
  padding: 0;
  text-align: center;
}

.pm-th {
  background: transparent;
  font-weight: 500;
  color: var(--spec-mute);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.62rem;
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid var(--spec-rule);
}

.pm-th-label {
  text-align: left;
  padding-left: 0;
  width: 40%;
}

.pm-th-glyph {
  display: inline-block;
  margin-right: 0.4rem;
  font-size: 0.95rem;
  vertical-align: -0.05em;
}

.pm-th-yes          { color: #6b8f71; }
.pm-th-conditional  { color: #8a7a5e; }
.pm-th-no           { color: #8a6b6b; }

.pm-row + .pm-row .pm-rowlabel,
.pm-row + .pm-row .pm-cell {
  border-top: 1px solid var(--spec-rule);
}

.pm-rowlabel {
  text-align: left;
  padding: 0.7rem 0.5rem 0.7rem 0;
  font-family: var(--spec-font-body);
  vertical-align: top;
  background: transparent;
}

.pm-rowlabel-l {
  display: block;
  font-weight: 500;
  color: var(--spec-ink);
  font-family: var(--spec-font-body);
  font-size: 0.85rem;
}

.pm-rowlabel-d {
  display: block;
  font-size: 0.72rem;
  color: var(--spec-mute);
  margin-top: 0.1rem;
}

.pm-cell {
  width: 18%;
  height: 44px;
  vertical-align: middle;
  background: transparent;
}

.pm-cell-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-family: var(--spec-font-mono);
  font-size: 0.95rem;
  font-weight: 600;
}
.pm-cell--active.pm-cell--yes .pm-cell-mark {
  background: var(--coverage-100);
  color: #3d5a3c;
}
.pm-cell--active.pm-cell--conditional .pm-cell-mark {
  background: var(--coverage-50);
  color: #6b623a;
}
.pm-cell--active.pm-cell--no .pm-cell-mark {
  background: var(--coverage-0);
  color: #7c4f55;
}

html.dark .pm-cell--active.pm-cell--yes .pm-cell-mark { color: #c9dcc8; }
html.dark .pm-cell--active.pm-cell--conditional .pm-cell-mark { color: #edeed5; }
html.dark .pm-cell--active.pm-cell--no .pm-cell-mark { color: #f0d6d6; }

.pm-cell:not(.pm-cell--active) .pm-cell-mark { visibility: hidden; }

.pm-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 1.5rem;
  font-family: var(--spec-font-mono);
  font-size: 0.7rem;
  color: var(--spec-mute);
  margin: 1rem 0 0;
}

.pm-legend-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
}
.pm-legend-mark--yes          { background: var(--coverage-100); color: #3d5a3c; }
.pm-legend-mark--conditional  { background: var(--coverage-50); color: #6b623a; }
.pm-legend-mark--no           { background: var(--coverage-0); color: #7c4f55; }
html.dark .pm-legend-mark--yes          { color: #c9dcc8; }
html.dark .pm-legend-mark--conditional  { color: #edeed5; }
html.dark .pm-legend-mark--no           { color: #f0d6d6; }

.pm-sr {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 640px) {
  .pm-rowlabel-d { display: none; }
}
</style>