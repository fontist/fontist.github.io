<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

interface FormulaData {
  name: string
  formulaName: string
  slug: string
  familyCount: number
  styleCount: number
  familyNames: string[]
  sourceType: string
  platforms: string[]
  licenseType: string
  licenseCategory: string
  licenseName: string
}

const formula = ref<FormulaData | null>(null)
const loading = ref(true)
const copied = ref(false)

const basePath = import.meta.env.BASE_URL || '/'

async function loadData() {
  loading.value = true
  try {
    const res = await fetch(`${basePath}formulas-data.json`)
    const data: FormulaData[] = await res.json()
    formula.value = data.find((f) => f.slug === slug.value) || null
  } catch (e) {
    console.error('Failed to load formula data:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
watch(slug, loadData)

function copyInstall() {
  if (!formula.value) return
  navigator.clipboard.writeText(`fontist install "${formula.value.formulaName}"`)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <div class="page-container">
    <div v-if="loading">
      <p>Loading…</p>
    </div>

    <div v-else-if="!formula">
      <h1 class="page-title">Formula not found</h1>
      <p>No formula found for: <code>{{ slug }}</code></p>
      <RouterLink to="/browse">← Back to Browse</RouterLink>
    </div>

    <template v-else>
      <h1 class="page-title">{{ formula.name }}</h1>

      <div class="formula-info">
        <dl class="info-grid">
          <div class="info-row">
            <dt>Formula Key</dt>
            <dd><code>{{ formula.formulaName }}</code></dd>
          </div>
          <div class="info-row">
            <dt>Families</dt>
            <dd>{{ formula.familyCount }}</dd>
          </div>
          <div class="info-row">
            <dt>Styles</dt>
            <dd>{{ formula.styleCount }}</dd>
          </div>
          <div class="info-row">
            <dt>Source</dt>
            <dd>{{ formula.sourceType }}</dd>
          </div>
          <div class="info-row">
            <dt>License</dt>
            <dd>{{ formula.licenseName }}</dd>
          </div>
          <div class="info-row" v-if="formula.familyNames.length">
            <dt>Family Names</dt>
            <dd>{{ formula.familyNames.join(', ') }}</dd>
          </div>
        </dl>
      </div>

      <div class="install-section">
        <h2>Install</h2>
        <div class="install-cmd-wrapper">
          <code class="install-cmd">fontist install "{{ formula.formulaName }}"</code>
          <button @click="copyInstall" class="copy-btn" :class="{ copied }">
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
      </div>

      <div class="font-link-section">
        <RouterLink :to="`/font/${slug}`" class="view-font-btn">
          View Font Specimen →
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.formula-info {
  margin-bottom: 2rem;
}

.info-grid {
  display: grid;
  gap: 0.75rem;
}

.info-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  align-items: baseline;
}

.info-row dt {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  font-weight: 600;
}

.info-row dd {
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
}

.info-row code {
  font-family: var(--vp-font-family-mono);
  background: var(--vp-c-bg-soft);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.875rem;
}

.install-section {
  margin-bottom: 2rem;
}

.install-section h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--vp-c-text-1);
}

.install-cmd-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.install-cmd {
  font-family: var(--vp-font-family-mono);
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
}

.copy-btn {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.15s;
}

.copy-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.copy-btn.copied {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: white;
}

.font-link-section {
  margin-top: 2rem;
}

.view-font-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--vp-c-brand-1);
  color: white;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s;
}

.view-font-btn:hover {
  background: var(--vp-c-brand-2);
}
</style>
