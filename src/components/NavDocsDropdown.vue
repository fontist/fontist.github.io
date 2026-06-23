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
.docs-dropdown {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.docs-trigger {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--spec-font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--spec-ink-soft);
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  padding: 0.375rem 0;
  transition: color 0.2s ease;
}
.docs-trigger:hover,
.docs-trigger.is-open {
  color: var(--spec-rose);
}
.docs-caret {
  transition: transform 0.2s ease;
}
.docs-trigger.is-open .docs-caret {
  transform: rotate(180deg);
}

.docs-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  min-width: 260px;
  background: var(--spec-paper);
  border: 1px solid var(--spec-rule);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08), 0 1px 0 var(--spec-rule);
  padding: 6px 0;
  z-index: 200;
}
.docs-item {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    "label arrow"
    "sub arrow";
  align-items: center;
  column-gap: 0.6rem;
  padding: 0.7rem 1rem;
  text-decoration: none;
  color: var(--spec-ink);
  transition: background 0.15s ease, color 0.15s ease;
}
.docs-item:hover {
  background: var(--spec-paper-deep);
}
.docs-item-label {
  grid-area: label;
  font-family: var(--spec-font-display);
  font-size: 15px;
  font-weight: 400;
  color: var(--spec-ink);
}
.docs-item:hover .docs-item-label { color: var(--spec-rose); }
.docs-item-sub {
  grid-area: sub;
  font-family: var(--spec-font-body);
  font-size: 12px;
  color: var(--spec-mute);
  letter-spacing: 0;
  text-transform: none;
}
.docs-item .ext-arrow {
  grid-area: arrow;
  align-self: center;
  font-size: 1em;
  color: var(--spec-mute);
}
.docs-item:hover .ext-arrow { color: var(--spec-rose); }

@media (max-width: 768px) {
  .docs-menu {
    position: static;
    box-shadow: none;
    border: none;
    margin-top: 0;
    padding: 0;
  }
}
</style>
