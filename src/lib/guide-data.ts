// Guide topic metadata — the structured data for /guide.
// The actual long-form content lives as markdown in public/content/guide/{slug}.md.

export type TopicCategory = 'getting-started' | 'workflow' | 'typography' | 'legal'

export interface GuideTopic {
  slug: string
  title: string
  blurb: string
  category: TopicCategory
  readingMinutes: number
  featured?: boolean
  related?: string[]   // slugs of related topics
  fileExists?: boolean  // markdown exists for this topic (set at runtime)
}

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    slug: 'what-is-formula',
    title: 'What is a Formula?',
    blurb: 'The fundamental concept behind Fontist — a recipe file that describes where to find fonts, how to verify them, and what they include.',
    category: 'getting-started',
    readingMinutes: 4,
    featured: true,
    related: ['formula-structure', 'choosing-formula', 'create-formula'],
  },
  {
    slug: 'choosing-formula',
    title: 'Choosing a Formula',
    blurb: 'When multiple formulas ship the same font family — Google, macOS, SIL — how do you pick which one to install?',
    category: 'getting-started',
    readingMinutes: 5,
    related: ['what-is-formula', 'formula-structure', 'license-considerations'],
  },
  {
    slug: 'create-formula',
    title: 'Creating a Formula',
    blurb: 'Write your own formula.yaml to package private fonts, custom distributions, or organization-internal type libraries.',
    category: 'workflow',
    readingMinutes: 8,
    related: ['formula-structure', 'private-repositories'],
  },
  {
    slug: 'formula-structure',
    title: 'Formula Structure Reference',
    blurb: 'The full anatomy of a formula file: resources, fonts, font_collections, hashes, and the metadata that ties them together.',
    category: 'workflow',
    readingMinutes: 6,
    related: ['what-is-formula', 'create-formula'],
  },
  {
    slug: 'private-repositories',
    title: 'Private Formula Repositories',
    blurb: 'Host formulas in a private Git repository so your organization can distribute fonts without exposing the formulas publicly.',
    category: 'workflow',
    readingMinutes: 4,
    related: ['create-formula', 'formula-structure'],
  },
  {
    slug: 'license-considerations',
    title: 'License Considerations',
    blurb: 'How to read font licenses for practical use cases: embedding, modifying, bundling in apps, commercial work.',
    category: 'legal',
    readingMinutes: 7,
    related: ['choosing-formula'],
  },
  {
    slug: 'unicode-coverage',
    title: 'Unicode Coverage Considerations',
    blurb: 'What to look for when a font needs to cover Latin, CJK, emoji, math, or specialist scripts — and what the gaps mean in practice.',
    category: 'typography',
    readingMinutes: 5,
    related: ['choosing-formula'],
  },
  {
    slug: 'multi-formula',
    title: 'Working with Multi-Formula Families',
    blurb: 'When the same family ships under several formulas (e.g., Roboto via google and via macOS), Fontist picks one — here\'s how to control that.',
    category: 'workflow',
    readingMinutes: 3,
    related: ['choosing-formula', 'formula-structure'],
  },
]

export const TOPIC_BY_SLUG: Record<string, GuideTopic> =
  Object.fromEntries(GUIDE_TOPICS.map(t => [t.slug, t]))

export function findTopic(slug: string): GuideTopic | undefined {
  return TOPIC_BY_SLUG[slug]
}

export const CATEGORY_LABELS: Record<TopicCategory, string> = {
  'getting-started': 'Getting started',
  'workflow':        'Workflow',
  'typography':      'Typography',
  'legal':           'License & legal',
}

export function topicsByCategory(): Record<TopicCategory, GuideTopic[]> {
  const out: Record<TopicCategory, GuideTopic[]> = {
    'getting-started': [], workflow: [], typography: [], legal: [],
  }
  for (const t of GUIDE_TOPICS) out[t.category].push(t)
  return out
}