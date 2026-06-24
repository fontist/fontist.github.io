<script setup lang="ts">
</script>

<template>
  <div class="page-container not-found-page">
    <h1 class="page-title">404 — Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <div class="actions">
      <RouterLink to="/" class="home-link">← Back to Home</RouterLink>
      <RouterLink to="/formulas" class="browse-link">Formulas →</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  text-align: center;
  padding: 4rem 1.5rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

.home-link,
.browse-link {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.15s;
}

.home-link {
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

.home-link:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.browse-link {
  background: var(--vp-c-brand-1);
  color: white;
}

.browse-link:hover {
  background: var(--vp-c-brand-2);
}
</style>
