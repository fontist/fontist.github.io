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
/* All styles migrated to src/styles/main.css (@layer components). */
</style>
