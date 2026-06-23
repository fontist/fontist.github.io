<script setup lang="ts">
import type { UnicodeCharacter, FontContext, GridMode } from '../../lib/unicode'

const props = withDefaults(defineProps<{
  characters: UnicodeCharacter[]
  fonts?: FontContext[]
  mode?: GridMode
  selectedCp?: number | null
}>(), {
  fonts: () => [],
  mode: 'standalone',
  selectedCp: null,
})

const emit = defineEmits<{ (e: 'select', cp: number): void }>()

function fontStyle(font: FontContext): Record<string, string> {
  if (!font.redistributable || !font.fontPath) return {}
  return { fontFamily: `'${font.fontId}', sans-serif` }
}

function isSupported(cp: number, font: FontContext): boolean {
  return font.coverage.has(cp)
}
</script>

<template>
  <div class="ub-grid">
    <template v-if="mode === 'multi-font' && fonts.length > 1">
      <div v-for="ch in characters" :key="ch.cp" class="ub-cell-multi"
        :class="{ active: selectedCp === ch.cp }" @click="emit('select', ch.cp)">
        <span class="ub-cp">{{ ch.hex }}</span>
        <div class="ub-glyphs">
          <div v-for="font in fonts" :key="font.slug" class="ub-glyph-slot">
            <span v-if="isSupported(ch.cp, font)" class="ub-glyph" :style="fontStyle(font)">{{ ch.char }}</span>
            <span v-else class="ub-glyph ub-missing">░</span>
            <span class="ub-font-tag" :style="{ color: font.color }">{{ font.slug }}</span>
          </div>
        </div>
        <span class="ub-name">{{ ch.name }}</span>
      </div>
    </template>

    <template v-else>
      <button v-for="ch in characters" :key="ch.cp"
        :class="['ub-cell', { active: selectedCp === ch.cp }]"
        @click="emit('select', ch.cp)">
        <span class="ub-cp">{{ ch.hex }}</span>
        <span v-if="fonts.length === 1 && fonts[0]" 
          class="ub-glyph" 
          :style="isSupported(ch.cp, fonts[0]) ? fontStyle(fonts[0]) : {}"
          :class="{ 'ub-fallback': fonts.length === 1 && !isSupported(ch.cp, fonts[0]) }">
          {{ ch.char }}
        </span>
        <span v-else class="ub-glyph">{{ ch.char }}</span>
        <span class="ub-name">{{ ch.name }}</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.ub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(158px, 1fr));
  gap: 6px;
}
.ub-cell, .ub-cell-multi {
  display: flex; flex-direction: column; align-items: center;
  width: 100%; min-height: 110px; padding: 8px;
  background: var(--vp-c-bg, #fff);
  border: 1px solid var(--vp-c-divider, #e2e2e3);
  border-radius: 6px; cursor: pointer; overflow: hidden;
  gap: 4px; transition: border-color 0.12s;
}
.ub-cell:hover, .ub-cell-multi:hover {
  border-color: var(--fontist-rose, #bf4e6a);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.ub-cell.active, .ub-cell-multi.active {
  border-color: var(--fontist-rose, #bf4e6a);
  border-width: 2px;
}
.ub-cp {
  font-size: 0.55rem; font-family: var(--vp-font-family-mono, monospace);
  color: var(--vp-c-text-3, #888); line-height: 1;
}
.ub-glyph {
  font-size: 2rem; line-height: 1; color: var(--vp-c-text-1, #333);
  flex: 1; display: flex; align-items: center;
}
.ub-fallback { color: var(--vp-c-text-3, #888); opacity: 0.3; }
.ub-name {
  font-size: 0.5rem; text-align: center; color: var(--vp-c-text-3, #888);
  line-height: 1.1; overflow: hidden;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}

/* Multi-font mode */
.ub-glyphs { display: flex; gap: 4px; flex: 1; align-items: center; justify-content: center; }
.ub-glyph-slot { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 40px; }
.ub-glyph-slot .ub-glyph { font-size: 1.4rem; }
.ub-missing { opacity: 0.2; }
.ub-font-tag {
  font-size: 0.45rem; font-family: var(--vp-font-family-mono, monospace);
  font-weight: 600;
}
</style>
