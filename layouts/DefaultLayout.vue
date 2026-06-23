<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="layout">
    <nav class="nav">
      <div class="nav-inner">
        <RouterLink to="/" class="nav-logo">Fontist</RouterLink>
        <div class="nav-links">
          <RouterLink to="/" class="nav-link">Home</RouterLink>
          <RouterLink to="/about" class="nav-link">About</RouterLink>
          <RouterLink to="/blog" class="nav-link">Blog</RouterLink>
          <a href="https://github.com/fontist/fontist" class="nav-link">GitHub</a>
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
        <a href="https://www.fontist.org">Fontist.org</a>
        <span>·</span>
        <a href="https://www.rubydoc.info/gems/fontist">RubyDocs</a>
      </div>
    </footer>
  </div>
</template>

<style>
.layout { min-height: 100vh; display: flex; flex-direction: column; }
.nav {
  position: sticky; top: 0; z-index: 100;
  background: rgba(255,255,255,0.95); backdrop-filter: blur(8px);
  border-bottom: 1px solid #e8e6e0;
}
.nav-inner {
  max-width: 960px; margin: 0 auto; padding: 0 1.5rem;
  display: flex; align-items: center; justify-content: space-between;
  height: 56px;
}
.nav-logo {
  font-weight: 700; font-size: 1.1rem; text-decoration: none;
  color: #1a1a1a;
}
.nav-links { display: flex; gap: 1.5rem; align-items: center; }
.nav-link {
  font-size: 0.88rem; text-decoration: none; color: #555;
  transition: color 0.1s;
}
.nav-link:hover { color: #bf4e6a; }

.main { flex: 1; }

.footer {
  border-top: 1px solid #e8e6e0; padding: 1.5rem;
  text-align: center; font-size: 0.82rem; color: #888;
}
.footer-inner { display: flex; gap: 0.5rem; justify-content: center; align-items: center; }
.footer a { color: #555; text-decoration: none; }
.footer a:hover { color: #bf4e6a; }
</style>
