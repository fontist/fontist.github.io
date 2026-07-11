import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { computed, defineComponent, h, Suspense } from 'vue'

// Mock the markdown loader so BlogPostPage doesn't try to fetch
vi.mock('../../src/lib/markdown/loader', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/markdown/loader')>()
  return {
    ...actual,
    loadParsedMarkdown: vi.fn(),
  }
})

// Mock router so pages using useRouter/useRoute mount cleanly
const mockRoute = { params: { slug: 'ufo-compilation' }, query: {} }
const mockRouter = { push: vi.fn(), replace: vi.fn() }
vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRoute,
  RouterLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
}))

vi.mock('@unhead/vue', () => ({
  useHead: vi.fn(),
}))

import { loadParsedMarkdown, clearMarkdownCache } from '../../src/lib/markdown/loader'
import NotFound from '../../src/islands/NotFound.vue'

describe('NotFound — 404 page structure', () => {
  it('renders 404 hero with display numeral', () => {
    const w = mount(NotFound)
    expect(w.find('.nf-title-num').text()).toBe('404')
    expect(w.find('.nf-title-em').text()).toBe('page not found')
  })

  it('renders suggestion list with at least 6 links', () => {
    const w = mount(NotFound)
    const suggestions = w.findAll('.nf-suggestion')
    expect(suggestions.length).toBeGreaterThanOrEqual(6)
  })

  it('each suggestion has a RouterLink with label + hint', () => {
    const w = mount(NotFound)
    const items = w.findAll('.nf-suggestion')
    for (const item of items) {
      expect(item.find('.nf-suggestion-label').text()).toBeTruthy()
      expect(item.find('.nf-suggestion-hint').text()).toBeTruthy()
    }
  })

  it('has a back-to-home link', () => {
    const w = mount(NotFound)
    expect(w.find('.nf-back').attributes('href')).toBe('/')
  })
})

describe('BlogPostPage — markdown + frontmatter integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(loadParsedMarkdown).mockReset()
    clearMarkdownCache()
  })

  async function mountBlog() {
    const BlogPostPage = (await import('../../src/islands/BlogPostPage.vue')).default
    const host = defineComponent({
      components: { BlogPostPage },
      render() {
        return h(Suspense, { suspensible: true }, () => h(BlogPostPage, { slug: "ufo-compilation" }))
      },
    })
    const w = mount(host)
    await flushPromises()
    await new Promise(r => setTimeout(r, 20))
    return w
  }

  it('renders title + body from parsed markdown', async () => {
    vi.mocked(loadParsedMarkdown).mockResolvedValue({
      raw: '',
      frontmatter: { title: 'UFO Compilation', date: '2026-05-20' },
      body: '# Hello world\n\nThis is a post.',
    })
    const w = await mountBlog()
    expect(w.find('.blog-title').text()).toContain('UFO Compilation')
    expect(w.find('.blog-body').html()).toContain('Hello world')
  })

  it('renders formatted date in eyebrow', async () => {
    vi.mocked(loadParsedMarkdown).mockResolvedValue({
      raw: '',
      frontmatter: { title: 'T', date: '2026-01-15' },
      body: 'body',
    })
    const w = await mountBlog()
    const time = w.find('time')
    expect(time.exists()).toBe(true)
    expect(time.attributes('datetime')).toBe('2026-01-15')
    expect(time.text()).toContain('2026')
  })

  it('renders single author without separator', async () => {
    vi.mocked(loadParsedMarkdown).mockResolvedValue({
      raw: '',
      frontmatter: { title: 'T', authors: ['Alice'] },
      body: 'body',
    })
    const w = await mountBlog()
    expect(vi.mocked(loadParsedMarkdown)).toHaveBeenCalled()
    expect(w.find('.blog-author').text()).toBe('Alice')
  })

  it('renders two authors with ampersand', async () => {
    vi.mocked(loadParsedMarkdown).mockResolvedValue({
      raw: '',
      frontmatter: { title: 'T', authors: ['Alice', 'Bob'] },
      body: 'Body.',
    })
    const w = await mountBlog()
    expect(w.find('.blog-author').text()).toBe('Alice & Bob')
  })

  it('renders 3+ authors with comma + ampersand', async () => {
    vi.mocked(loadParsedMarkdown).mockResolvedValue({
      raw: '',
      frontmatter: { title: 'T', authors: ['Alice', 'Bob', 'Carol', 'Dan'] },
      body: 'Body.',
    })
    const w = await mountBlog()
    expect(w.find('.blog-author').text()).toBe('Alice, Bob, Carol & Dan')
  })

  it('omits eyebrow entirely when no date and no authors', async () => {
    vi.mocked(loadParsedMarkdown).mockResolvedValue({
      raw: '',
      frontmatter: { title: 'T' },
      body: '',
    })
    const w = await mountBlog()
    expect(w.find('.blog-eyebrow').exists()).toBe(false)
  })
})

describe('ComparePage — slug parsing logic', () => {
  // The slugsFromUrl computed: comma-separated, max 4
  // Tested via the parsing logic in isolation (mirror the implementation)
  it('splits comma-separated slugs', () => {
    function parse(param: string | undefined): string[] {
      if (!param) return []
      return param.split(',').filter(Boolean).slice(0, 4)
    }
    expect(parse('abel,inter,roboto')).toEqual(['abel', 'inter', 'roboto'])
    expect(parse('a,b,c,d,e')).toHaveLength(4)
    expect(parse(undefined)).toEqual([])
    expect(parse('')).toEqual([])
  })
})
