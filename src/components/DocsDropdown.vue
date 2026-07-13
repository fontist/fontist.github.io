<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const closeTimer = ref<ReturnType<typeof setTimeout> | null>(null)

function openMenu() {
  if (closeTimer.value) {
    clearTimeout(closeTimer.value)
    closeTimer.value = null
  }
  open.value = true
}

function scheduleClose() {
  if (closeTimer.value) clearTimeout(closeTimer.value)
  closeTimer.value = setTimeout(() => {
    open.value = false
  }, 200)
}

function toggle() {
  open.value = !open.value
}

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
  if (closeTimer.value) clearTimeout(closeTimer.value)
})

const items = [
  { href: 'https://www.fontist.org/fontist/', label: 'Fontist', sub: 'Install & manage fonts' },
  { href: 'https://www.fontist.org/fontisan/', label: 'Fontisan', sub: 'Build & convert fonts' },
]
</script>

<template>
  <div
    ref="root"
    class="relative inline-flex items-center"
    @mouseenter="openMenu"
    @mouseleave="scheduleClose"
  >
    <button
      type="button"
      class="inline-flex cursor-pointer items-center gap-1 border-none bg-transparent px-0 py-1.5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-ink-soft transition-colors duration-200"
      :class="open ? 'text-accent' : 'hover:text-accent'"
      :aria-expanded="open"
      @click="toggle"
    >
      Docs
      <svg
        class="transition-transform duration-200"
        :class="{ 'rotate-180': open }"
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"
      >
        <path d="M3 4.5 L6 7.5 L9 4.5" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- pt-2 bridges the gap so cursor never leaves the hover area -->
    <div
      v-show="open"
      class="absolute left-0 top-full z-[200] pt-2"
      role="menu"
    >
      <div class="min-w-[260px] border border-rule bg-paper p-1.5 shadow-lg">
        <a
          v-for="item in items"
          :key="item.href"
          :href="item.href"
          class="grid items-center gap-x-2 rounded-sm px-3 py-2.5 no-underline transition-colors duration-150 hover:bg-paper-deep"
          style="grid-template-columns: 1fr auto; grid-template-areas: 'label arrow' 'sub arrow';"
          role="menuitem"
        >
          <span class="font-display text-[15px] font-normal text-ink" style="grid-area: label">{{ item.label }}</span>
          <span class="font-body text-xs text-mute" style="grid-area: sub">{{ item.sub }}</span>
          <span class="self-center text-mute" style="grid-area: arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  </div>
</template>
