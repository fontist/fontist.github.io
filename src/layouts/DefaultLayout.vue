<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useTheme } from '../composables/useTheme'
import NavDocsDropdown from '../components/NavDocsDropdown.vue'

const { theme, toggle } = useTheme()
</script>

<template>
  <div class="layout">
    <nav class="nav">
      <div class="nav-inner">
        <RouterLink to="/" class="nav-logo">
          <img src="/favicon.svg" alt="Fontist" class="nav-logo-img" />
          Fontist
        </RouterLink>
        <div class="nav-links">
          <NavDocsDropdown />
          <RouterLink to="/browse" class="nav-link">Browse</RouterLink>
          <RouterLink to="/fonts" class="nav-link">Fonts</RouterLink>
          <RouterLink to="/licenses" class="nav-link">Licenses</RouterLink>
          <RouterLink to="/guide" class="nav-link">Guide</RouterLink>
          <RouterLink to="/unicode" class="nav-link">Unicode</RouterLink>
          <RouterLink to="/blog" class="nav-link">Blog</RouterLink>
          <RouterLink to="/about" class="nav-link">About</RouterLink>
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
          <a href="https://github.com/fontist/fontist" class="nav-icon-link" aria-label="GitHub repository" title="GitHub">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
          </a>
        </div>
      </div>
    </nav>
    <main class="main">
      <slot />
    </main>
    <footer class="footer">
      <div class="footer-inner">
        <a href="https://github.com/fontist">GitHub</a>
        <span>·</span>
        <RouterLink to="/about">About</RouterLink>
        <span>·</span>
        <a href="https://www.rubydoc.info/gems/fontist">RubyDocs</a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout { min-height: 100vh; display: flex; flex-direction: column; background: var(--spec-paper); }
.nav {
  position: sticky; top: 0; z-index: 100;
  background: var(--spec-paper);
  box-shadow: 0 1px 0 var(--spec-rule);
}
.nav-inner {
  max-width: 1320px; margin: 0 auto; padding: 0 clamp(20px, 4vw, 56px);
  display: flex; align-items: center; justify-content: space-between;
  height: var(--vp-nav-height);
}
.nav-logo {
  display: flex; align-items: center; gap: 0.5rem;
  font-family: var(--spec-font-display);
  font-weight: 400; font-size: 18px;
  letter-spacing: 0.02em;
  text-decoration: none;
  color: var(--spec-ink);
  flex-shrink: 0;
}
.nav-logo-img { width: 32px; height: 32px; }
.nav-links { display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; }
.nav-link {
  font-family: var(--spec-font-mono);
  font-size: 12px; font-weight: 500;
  letter-spacing: 0.14em; text-transform: uppercase;
  text-decoration: none;
  color: var(--spec-ink-soft);
  transition: color 0.2s ease;
}
.nav-link:hover { color: var(--spec-rose); }
.nav-link.router-link-active { color: var(--spec-rose); }
.ext-arrow {
  font-size: 0.78em;
  margin-left: 0.18em;
  vertical-align: super;
  color: var(--spec-mute);
  transition: color 0.2s ease;
}
.nav-link:hover .ext-arrow { color: var(--spec-rose); }

.nav-icon-btn {
  background: none;
  border: 1px solid transparent;
  color: var(--spec-ink-soft);
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}
.nav-icon-btn:hover {
  color: var(--spec-rose);
  border-color: var(--spec-rule);
}
.nav-icon-btn:focus-visible {
  outline: 2px solid var(--spec-rose);
  outline-offset: 2px;
}

.nav-icon-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--spec-ink-soft);
  border-radius: 4px;
  transition: color 0.2s ease;
}
.nav-icon-link:hover { color: var(--spec-rose); }

.main { flex: 1; }

.footer {
  border-top: 1px solid var(--spec-rule);
  padding: 28px 24px 40px;
  font-family: var(--spec-font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--spec-mute);
}
.footer-inner {
  max-width: 1320px; margin: 0 auto;
  display: flex; gap: 0.75rem; justify-content: center; align-items: center;
}
.footer a {
  font-family: var(--spec-font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--spec-ink-soft);
  text-decoration: none;
  border-bottom: 1px solid var(--spec-rule-strong);
  padding-bottom: 2px;
  transition: color 0.2s, border-color 0.2s;
}
.footer a:hover { color: var(--spec-rose); border-color: var(--spec-rose); }

@media (max-width: 768px) {
  .nav-inner { padding: 0 1rem; }
  .nav-links { gap: 1rem; overflow-x: auto; }
}
</style>
