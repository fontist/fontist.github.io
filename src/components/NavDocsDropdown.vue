<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) {
    open.value = false
  }
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="docs-dropdown" ref="root" @mouseenter="open = true" @mouseleave="open = false">
    <button
      type="button"
      class="nav-link docs-trigger"
      :class="{ 'is-open': open }"
      :aria-expanded="open"
      @click="open = !open"
    >
      Docs
      <svg class="docs-caret" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
        <path d="M3 4.5 L6 7.5 L9 4.5" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div v-show="open" class="docs-menu" role="menu">
      <a href="https://www.fontist.org/fontist/" class="docs-item" role="menuitem">
        <span class="docs-item-label">Fontist</span>
        <span class="docs-item-sub">Install & manage fonts</span>
        <span class="ext-arrow" aria-hidden="true">↗</span>
      </a>
      <a href="https://www.fontist.org/fontisan/" class="docs-item" role="menuitem">
        <span class="docs-item-label">Fontisan</span>
        <span class="docs-item-sub">Build & convert fonts</span>
        <span class="ext-arrow" aria-hidden="true">↗</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
