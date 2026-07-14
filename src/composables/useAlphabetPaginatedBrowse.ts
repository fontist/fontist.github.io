import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

export interface AlphabetPaginatedBrowse<T> {
  searchQuery: Ref<string>
  filteredItems: ComputedRef<T[]>
  pagedItems: ComputedRef<T[]>
  groupedByLetter: ComputedRef<Record<string, T[]>>
  activeLetters: ComputedRef<string[]>
  currentPage: Ref<number>
  totalPages: ComputedRef<number>
  pageWindow: ComputedRef<number[]>
  showingFrom: ComputedRef<number>
  showingTo: ComputedRef<number>
  goToPage: (page: number) => void
  scrollToLetter: (letter: string) => void
  resetPage: () => void
}

export function useAlphabetPaginatedBrowse<T>(
  items: Ref<T[]> | ComputedRef<T[]>,
  options: {
    pageSize?: number
    nameAccessor: (item: T) => string
    searchAccessor?: (item: T) => string | string[]
    scrollSelector?: string
  },
): AlphabetPaginatedBrowse<T> {
  const { pageSize = 50, nameAccessor, searchAccessor, scrollSelector = '.browse-root' } = options

  const searchQuery = ref('')
  const currentPage = ref(1)

  if (typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) searchQuery.value = q
    const p = new URLSearchParams(window.location.search).get('page')
    if (p) {
      const n = parseInt(p, 10)
      if (!isNaN(n) && n >= 1) currentPage.value = n
    }
  }

  const filteredItems = computed(() => {
    if (!searchQuery.value || !searchAccessor) return items.value
    const q = searchQuery.value.toLowerCase()
    return items.value.filter(item => {
      const fields = searchAccessor(item)
      const arr = Array.isArray(fields) ? fields : [fields]
      return arr.some(f => (f || '').toLowerCase().includes(q))
    })
  })

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(filteredItems.value.length / pageSize)),
  )

  const pagedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return filteredItems.value.slice(start, start + pageSize)
  })

  const groupedByLetter = computed(() => {
    const groups: Record<string, T[]> = {}
    for (const item of pagedItems.value) {
      const letter = (nameAccessor(item) || '?').charAt(0).toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(item)
    }
    return groups
  })

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  const activeLetters = computed(() =>
    alphabet.filter(letter => (groupedByLetter.value[letter]?.length ?? 0) > 0),
  )

  const showingFrom = computed(() =>
    filteredItems.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize + 1,
  )
  const showingTo = computed(() =>
    Math.min(currentPage.value * pageSize, filteredItems.value.length),
  )

  const pageWindow = computed(() => {
    const pages: number[] = []
    const start = Math.max(1, currentPage.value - 2)
    const end = Math.min(totalPages.value, currentPage.value + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  })

  watch(searchQuery, () => { currentPage.value = 1 })
  watch(items, () => { currentPage.value = 1 })

  function syncUrl() {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (searchQuery.value) url.searchParams.set('q', searchQuery.value)
    else url.searchParams.delete('q')
    if (currentPage.value > 1) url.searchParams.set('page', String(currentPage.value))
    else url.searchParams.delete('page')
    window.history.replaceState({}, '', url)
  }

  function goToPage(page: number) {
    currentPage.value = page
    const el = document.querySelector(scrollSelector)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    syncUrl()
  }

  function scrollToLetter(letter: string) {
    const el = document.getElementById('letter-' + letter)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function resetPage() {
    currentPage.value = 1
    syncUrl()
  }

  return {
    searchQuery,
    filteredItems,
    pagedItems,
    groupedByLetter,
    activeLetters,
    currentPage,
    totalPages,
    pageWindow,
    showingFrom,
    showingTo,
    goToPage,
    scrollToLetter,
    resetPage,
  }
}
