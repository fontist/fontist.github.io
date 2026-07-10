<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useTheme } from '../composables/useTheme'
import NavDocsDropdown from '../components/NavDocsDropdown.vue'
import SiteFooter from '../components/SiteFooter.vue'

const { theme, toggle } = useTheme()
const route = useRoute()
const menuOpen = ref(false)

// Close the mobile menu whenever the route changes — covers both
// link clicks and programmatic navigations.
watch(() => route.fullPath, () => { menuOpen.value = false })

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && menuOpen.value) menuOpen.value = false
}
onMounted(() => { document.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { document.removeEventListener('keydown', onKey) })
</script>

<template>
  <div class="layout">
    <nav class="nav">
      <div class="nav-inner">
        <RouterLink to="/" class="nav-logo">
          <img src="/favicon.svg" alt="Fontist" class="nav-logo-img" />
          Fontist
        </RouterLink>
        <div
          id="nav-menu"
          :class="['nav-links', { 'nav-links--open': menuOpen }]"
          role="navigation"
          aria-label="Main"
        >
          <NavDocsDropdown />
          <RouterLink to="/formulas" class="nav-link">Formulas</RouterLink>
          <RouterLink to="/families" class="nav-link">Families</RouterLink>
          <RouterLink to="/licenses" class="nav-link">Licenses</RouterLink>
          <RouterLink to="/guide" class="nav-link">Guide</RouterLink>
          <RouterLink to="/unicode" class="nav-link">Unicode</RouterLink>
          <RouterLink to="/blog" class="nav-link">Blog</RouterLink>
          <RouterLink to="/about" class="nav-link">About</RouterLink>
        </div>
        <div class="nav-utility">
          <button
            type="button"
            class="nav-icon-btn theme-toggle"
            :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
            :title="theme === 'dark' ? 'Light mode' : 'Dark mode'"
            @click="toggle"
          >
            <svg v-if="theme === 'dark'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="12" cy="12" r="4.4" fill="currentColor"/>
              <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                <line x1="12" y1="2.5" x2="12" y2="5"/>
                <line x1="12" y1="19" x2="12" y2="21.5"/>
                <line x1="2.5" y1="12" x2="5" y2="12"/>
                <line x1="19" y1="12" x2="21.5" y2="12"/>
                <line x1="5.2" y1="5.2" x2="6.9" y2="6.9"/>
                <line x1="17.1" y1="17.1" x2="18.8" y2="18.8"/>
                <line x1="5.2" y1="18.8" x2="6.9" y2="17.1"/>
                <line x1="17.1" y1="6.9" x2="18.8" y2="5.2"/>
              </g>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M20.5 14.3A8.6 8.6 0 0 1 9.7 3.5a8.6 8.6 0 1 0 10.8 10.8z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button
            type="button"
            class="nav-icon-btn nav-burger"
            :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
            :aria-expanded="menuOpen"
            aria-controls="nav-menu"
            @click="menuOpen = !menuOpen"
          >
            <svg v-if="!menuOpen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
    <main class="main">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
/* All styles migrated to src/styles/main.css (@layer components). */
</style>

