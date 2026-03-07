# Fontist Website

[![Deploy Pages](https://github.com/fontist/fontist.github.io/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/fontist/fontist.github.io/actions/workflows/deploy-pages.yml)

This is the source for [fontist.org](https://fontist.org), built with [VitePress](https://vitepress.dev/).

## Development

```bash
npm install     # Install dependencies
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

## Adding Blog Posts

1. Create a new `.md` file in `blog/` with frontmatter
2. Add an entry to `blog/index.md`

## Sub-sites

- [fontist.org/fontist/](https://fontist.org/fontist/) - Main documentation (from [fontist/fontist](https://github.com/fontist/fontist))
- [fontist.org/formulas/](https://fontist.org/formulas/) - Searchable formulas index (from [fontist/formulas](https://github.com/fontist/formulas))
