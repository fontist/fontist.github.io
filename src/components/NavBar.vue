<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import DocsDropdown from './DocsDropdown.vue'
import { useFunStuff } from '../composables/useFunStuff'

useFunStuff()

const props = withDefaults(defineProps<{
  currentPath?: string
}>(), {
  currentPath: '/',
})

const theme = ref<'light' | 'dark'>('light')
const menuOpen = ref(false)
const burger = ref<HTMLElement | null>(null)

function syncTheme() {
  theme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function toggleTheme() {
  const html = document.documentElement
  const isDark = html.classList.toggle('dark')
  theme.value = isDark ? 'dark' : 'light'
  try {
    localStorage.setItem('fontist-theme', isDark ? 'dark' : 'light')
  } catch (e) {}
}

function toggleBurger() {
  menuOpen.value = !menuOpen.value
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    menuOpen.value = false
    burger.value?.focus()
  }
}

const navLinks = [
  { href: '/blog', label: 'News' },
  { href: '/v1/formulas', label: 'Formulas' },
  { href: '/families', label: 'Families' },
  { href: '/licenses', label: 'Licenses' },
  { href: '/guide', label: 'Guide' },
  { href: '/unicode', label: 'Unicode' },
  { href: '/about', label: 'About' },
]

function isActive(href: string): boolean {
  if (href === '/') return props.currentPath === '/'
  return props.currentPath === href || props.currentPath.startsWith(href + '/')
}

onMounted(() => {
  syncTheme()
  document.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <nav class="sticky top-0 z-[100] border-b border-rule bg-paper">
    <div class="mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-6 px-[clamp(20px,4vw,56px)]">
      <a href="/" class="flex flex-shrink-0 items-center no-underline">
        <img src="/logo-full.svg" alt="Fontist" class="nav-logo-img h-7 w-auto" />
      </a>

      <div
        id="nav-menu"
        class="flex items-center gap-6"
        :class="{ 'nav-links--open': menuOpen }"
        role="navigation"
        aria-label="Main"
      >
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          class="font-mono text-xs font-medium uppercase tracking-[0.14em] text-ink-soft no-underline transition-colors duration-200 hover:text-accent"
          :class="{ 'text-accent': isActive(link.href) }"
          @click="menuOpen = false"
        >
          {{ link.label }}
        </a>

        <span class="mx-1 h-4 w-px bg-rule" aria-hidden="true"></span>
        <DocsDropdown />
      </div>

      <div class="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-transparent text-ink-soft transition-colors duration-200 hover:border-rule hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
          :title="theme === 'dark' ? 'Light mode' : 'Dark mode'"
          @click="toggleTheme"
        >
          <svg v-show="theme === 'dark'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
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
          <svg v-show="theme === 'light'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M20.5 14.3A8.6 8.6 0 0 1 9.7 3.5a8.6 8.6 0 1 0 10.8 10.8z" fill="currentColor"/>
          </svg>
        </button>

        <button
          ref="burger"
          type="button"
          class="nav-burger inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-transparent text-ink-soft transition-colors duration-200 hover:text-accent"
          :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
          :aria-expanded="menuOpen"
          aria-controls="nav-menu"
          @click="toggleBurger"
        >
          <svg v-show="!menuOpen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <svg v-show="menuOpen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Burger button hidden on desktop, visible on mobile */
@media (min-width: 769px) {
  .nav-burger { display: none; }
}

/* Mobile nav-links hidden by default, shown when open */
@media (max-width: 768px) {
  #nav-menu {
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--color-paper);
    border-bottom: 1px solid var(--color-rule);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    transform: translateY(-100%);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.25s ease, opacity 0.2s ease;
    z-index: 99;
  }
  #nav-menu.nav-links--open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
}

/* Dark mode: lighten the logo so the gray wordmark is visible on dark bg */
:global(html.dark) .nav-logo-img {
  filter: brightness(1.6) saturate(0.85);
}
</style>
