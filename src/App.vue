<script setup lang="ts">
import { RouterView } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'
</script>

<template>
  <DefaultLayout>
    <RouterView v-slot="{ Component }">
      <Suspense>
        <component :is="Component" />
        <template #fallback>
          <div class="page-loading">Loading…</div>
        </template>
      </Suspense>
    </RouterView>
  </DefaultLayout>
</template>

<style>
.page-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: var(--vp-c-text-3, #888);
  font-family: var(--vp-font-family-base, system-ui, sans-serif);
}
</style>
