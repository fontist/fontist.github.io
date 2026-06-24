<script setup lang="ts">
import FormulaBrowser from '../components/FormulaBrowser.vue'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Formulas — Fontist',
  meta: [
    { name: 'description', content: 'Browse 4,200+ openly-licensed font formulas. Filter by license, source, or search by name.' },
    { property: 'og:title', content: 'Formulas — Fontist' },
    { property: 'og:type', content: 'website' },
  ],
  link: [
    { rel: 'canonical', href: 'https://www.fontist.org/formulas' },
  ],
})
</script>

<template>
  <div class="page-container">
    <FormulaBrowser />
  </div>
</template>
