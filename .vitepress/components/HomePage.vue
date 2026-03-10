<script setup lang="ts">
import { ref } from "vue";

const products = [
  {
    id: "fontist",
    title: "Fontist",
    tagline: "Install & Manage Fonts",
    description:
      "A cross-platform font installer and manager. Install openly-licensed fonts on Windows, Linux, and macOS with a single command.",
    icon: "download",
    link: "https://fontist.org/fontist/",
    cta: "View Documentation",
  },
  {
    id: "fontisan",
    title: "Fontisan",
    tagline: "Build & Convert Fonts",
    description:
      "Manipulate, convert, and build fonts programmatically. Perfect for font workflows in automated pipelines.",
    icon: "settings",
    link: "https://fontist.org/fontisan/",
    cta: "View Documentation",
  },
  {
    id: "formulas",
    title: "Fontist Formulas",
    tagline: "Open Font Registry",
    description:
      "A searchable index of 2,000+ font formulas for automated installation of openly-licensed fonts from across the internet.",
    icon: "package",
    link: "https://fontist.org/formulas/",
    cta: "Browse Formulas",
  },
];

const hoveredCard = ref<string | null>(null);

const icons = {
  download: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`,
  settings: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
  package: `<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>`,
  edit: `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
};
</script>

<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">
          <span>Cross-Platform Font Management</span>
        </div>
        <h1 class="hero-title">
          Fonts for the
          <span class="highlight">Modern Workflow</span>
        </h1>
        <p class="hero-description">
          Install, manage, and build fonts programmatically across Windows, Linux, and macOS.
          Designed for automated systems, CI/CD pipelines, and digital publishing.
        </p>
        <div class="hero-actions">
          <a href="https://fontist.org/fontist/" class="btn btn-primary">
            Get Started
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          <a href="/about/" class="btn btn-secondary">Learn More</a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="code-preview">
          <div class="code-header">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="code-title">Terminal</span>
          </div>
          <pre class="code-content"><code><span class="prompt">$</span> gem install fontist fontisan
<span class="prompt">$</span> fontist install "Roboto"
<span class="success">✓</span> Fonts installed at ~/.fontist/fonts/
<span class="prompt">$</span> fontisan convert --to woff2 ~/.fontist/fonts/Roboto-Regular.ttf
<span class="success">✓</span> Created: Roboto-Regular.woff2</code></pre>
        </div>
      </div>
    </section>

    <!-- Products Section -->
    <section class="products">
      <div class="section-header">
        <h2>Our Products</h2>
        <p>Everything you need for font management in automated environments</p>
      </div>

      <div class="products-grid">
        <article
          v-for="product in products"
          :key="product.id"
          class="product-card"
          :class="{ 'is-hovered': hoveredCard === product.id }"
          @mouseenter="hoveredCard = product.id"
          @mouseleave="hoveredCard = null"
        >
          <a :href="product.link" class="card-link">
            <div class="card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" v-html="icons[product.icon as keyof typeof icons]" />
            </div>
            <div class="card-body">
              <span class="card-tagline">{{ product.tagline }}</span>
              <h3 class="card-title">{{ product.title }}</h3>
              <p class="card-description">{{ product.description }}</p>
            </div>
            <div class="card-footer">
              <span class="card-cta">
                {{ product.cta }}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </div>
          </a>
        </article>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats">
      <div class="stat-item">
        <span class="stat-value">2,175+</span>
        <span class="stat-label">Font Formulas</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">14,500+</span>
        <span class="stat-label">Font Styles</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">Est. 2020</span>
        <span class="stat-label">Serving Open Source</span>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="feature">
        <div class="feature-icon">🖥️</div>
        <h3>Native OS Integration</h3>
        <p>Deep integration with <strong>macOS</strong>, <strong>Linux</strong>, and <strong>Windows</strong>. Access system fonts, supplementary fonts, and install directly into your operating system.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">⚡</div>
        <h3>Flexible Font Management</h3>
        <p>Choose integrated or separate font management. Let Fontist handle installation, or maintain your own font directories with full control.</p>
      </div>
    </section>

    <!-- Why Fontist Section -->
    <section class="why-fontist">
      <div class="why-content">
        <div class="why-logo">
          <img src="/logo.svg" alt="Fontist Logo" />
        </div>
        <div class="why-text">
          <h2>Why Fontist?</h2>
          <p>
            Born from the need for cross-platform font management in automated publishing workflows,
            Fontist has become the de-facto solution for installing open-source fonts in CI/CD pipelines
            and digital publishing systems.
          </p>
          <a href="/about/" class="why-link">
            Learn about our story, mission, and the meaning behind our logo
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Hero Section */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  padding: 4rem 0 5rem;
}

.hero-content {
  max-width: 540px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--vp-c-brand-soft);
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: 3.25rem;
  font-weight: 700;
  line-height: 1.1;
  margin: 0 0 1.5rem 0;
  color: var(--vp-c-text-1);
}

.hero-title .highlight {
  background: linear-gradient(120deg, var(--vp-c-brand-1) 30%, var(--fontist-rose-light, #d4718a));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  margin: 0 0 2rem 0;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: white;
}

.btn-primary:hover {
  background: var(--vp-button-brand-hover-bg, #a3435a);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.btn-secondary:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

/* Code Preview */
.code-preview {
  background: var(--fontist-dark);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.code-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.dot:nth-child(1) { background: #ff5f57; }
.dot:nth-child(2) { background: #ffbd2e; }
.dot:nth-child(3) { background: #28ca42; }

.code-title {
  margin-left: auto;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.code-content {
  padding: 1.25rem 1.5rem;
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.875rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
}

.code-content code {
  background: none;
  padding: 0;
}

.prompt { color: var(--vp-c-brand-1); }
.success { color: #28ca42; }
.path { color: rgba(255, 255, 255, 0.6); }

/* Products Section */
.products {
  padding: 4rem 0;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-header h2 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  color: var(--vp-c-text-1);
}

.section-header p {
  font-size: 1.0625rem;
  color: var(--vp-c-text-2);
  margin: 0;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.product-card {
  position: relative;
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  border: 1px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-card:hover,
.product-card.is-hovered {
  background: var(--vp-c-bg);
  border-color: var(--vp-c-brand-1);
  transform: translateY(-4px);
  box-shadow:
    0 8px 16px -4px rgba(0, 0, 0, 0.08),
    0 16px 32px -8px rgba(191, 78, 106, 0.1);
}

.card-link {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem;
  text-decoration: none;
  color: inherit;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: var(--vp-c-brand-soft);
  border-radius: 12px;
  color: var(--vp-c-brand-1);
  margin-bottom: 1.25rem;
  transition: all 0.3s ease;
}

.product-card:hover .card-icon {
  background: var(--vp-c-brand-1);
  color: white;
}

.card-body {
  flex: 1;
}

.card-tagline {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-brand-1);
  margin-bottom: 0.5rem;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  color: var(--vp-c-text-1);
}

.card-description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin: 0;
}

.card-footer {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--vp-c-divider);
}

.card-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
}

.card-cta svg {
  transition: transform 0.3s ease;
}

.product-card:hover .card-cta svg {
  transform: translateX(4px);
}

/* Stats Section */
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  padding: 3rem 0;
  border-top: 1px solid var(--vp-c-divider);
  margin-top: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

/* Why Fontist Section */
.why-fontist {
  padding: 4rem 0;
  border-top: 1px solid var(--vp-c-divider);
  margin-top: 1rem;
}

.why-content {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 3rem;
  align-items: center;
}

.why-logo {
  display: flex;
  justify-content: center;
}

.why-logo img {
  width: 140px;
  height: auto;
  opacity: 0.9;
}

.why-text h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-1);
}

.why-text p {
  font-size: 1.0625rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  margin: 0 0 1.5rem 0;
}

.why-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  transition: gap 0.2s ease;
}

.why-link:hover {
  gap: 0.75rem;
}

.why-link svg {
  transition: transform 0.2s ease;
}

.why-link:hover svg {
  transform: translateX(4px);
}

/* Features Section */
.features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.feature {
  padding: 1.5rem 2rem;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.feature:hover {
  border-color: var(--vp-c-brand-1);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.feature h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-text-1);
}

.feature p {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin: 0;
}

.feature p strong {
  color: var(--vp-c-text-1);
}

/* Responsive */
@media (max-width: 968px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 3rem;
    padding: 3rem 0;
  }

  .hero-visual {
    order: -1;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }

  .stats {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 969px) and (max-width: 1100px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .stat-value {
    font-size: 2rem;
  }

  .why-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .why-logo img {
    width: 100px;
  }

  .features {
    grid-template-columns: 1fr;
  }
}
</style>
