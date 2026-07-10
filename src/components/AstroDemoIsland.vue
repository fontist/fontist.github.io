<script setup>
// Minimal Vue island for the Astro migration proof page.
// Verifies that @astrojs/vue hydration + Tailwind 4 classes work
// inside Vue components mounted from .astro pages.
import { ref } from 'vue'

const props = defineProps({
  label: { type: String, default: 'Click' },
})

const count = ref(0)
</script>

<template>
  <div class="p-4 border border-rule">
    <button
      class="px-3 py-1 bg-ink text-paper font-mono text-sm rounded-sm hover:bg-rose transition-colors"
      @click="count++"
    >
      {{ label }}: {{ count }}
    </button>
    <p class="mt-2 text-xs text-mute font-mono">
      Hydrated island — Tailwind tokens + Vue reactivity.
    </p>
  </div>
</template>
