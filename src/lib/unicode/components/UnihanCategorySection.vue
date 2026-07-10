<script setup lang="ts">
import type { UnihanField } from '../../types/domain.ts'
import { charRoute } from '../constants.ts'
import { isCodepointRef, isSelfReference, glyphOf } from '../unihan.ts'

type RenderMode = 'text' | 'variant'

const props = defineProps<{
  heading: string
  fields: UnihanField[] | undefined
  render: RenderMode
  selfCp: number
}>()
</script>

<template>
  <section v-if="fields && fields.length > 0" class="ucp-section">
    <h2>{{ heading }}</h2>
    <dl>
      <template v-for="(f, i) in fields" :key="i">
        <dt>{{ f.name }}</dt>
        <dd v-if="render === 'text'">{{ f.values.join(', ') }}</dd>
        <dd v-else>
          <span class="ucp-variant-list">
            <template v-for="(val, j) in f.values" :key="j">
              <span class="ucp-variant-item">
                <span v-if="isSelfReference(val, props.selfCp)" class="ucp-variant-self" title="self-reference">
                  <span class="ucp-variant-self-label">self</span>
                  <span class="ucp-variant-glyph ucp-variant-glyph-self">{{ glyphOf(val) }}</span>
                </span>
                <RouterLink v-else-if="isCodepointRef(val)" :to="charRoute(val)" class="ucp-variant-link">
                  <code class="ucp-variant-cp">{{ val }}</code>
                  <span class="ucp-variant-glyph">{{ glyphOf(val) }}</span>
                </RouterLink>
                <code v-else>{{ val }}</code>
              </span>
              <span v-if="j < f.values.length - 1" class="ucp-variant-sep">·</span>
            </template>
          </span>
        </dd>
      </template>
    </dl>
  </section>
</template>

<style scoped>
.ucp-variant-list { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 0.3rem; }
.ucp-variant-item { display: inline-flex; align-items: baseline; gap: 0.35rem; }
.ucp-variant-link { display: inline-flex; align-items: baseline; gap: 0.35rem; text-decoration: none; color: inherit; }
.ucp-variant-link:hover { color: var(--spec-rose, #b8475f); }
.ucp-variant-cp { font-family: var(--font-mono); font-size: 0.85em; color: var(--color-mute); }
.ucp-variant-glyph { font-size: 1.5rem; line-height: 1; color: var(--color-ink); }
.ucp-variant-sep { color: var(--color-mute); margin: 0 0.2rem; }
.ucp-variant-self { display: inline-flex; align-items: baseline; gap: 0.3rem; padding: 0.15rem 0.4rem; border: 1px dashed var(--spec-rule); border-radius: 6px; opacity: 0.75; }
.ucp-variant-self-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-mute); font-weight: 500; }
.ucp-variant-glyph-self { color: var(--color-mute); }
</style>
