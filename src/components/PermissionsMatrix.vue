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
/* All styles migrated to src/styles/main.css (@layer components). */
</style>