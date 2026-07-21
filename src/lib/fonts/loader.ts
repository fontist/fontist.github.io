// Font registry/metadata loaders. These look like single-consumer wrappers
// (only ComparePage imports them today) but the seam is real: the Astro
// migration (TODO.astro/04 — dynamic pages) reintroduces these loaders for
// FontPage, FontStylePage, etc. via getStaticPaths. Two consumers — the
// deletion-test signal for a real seam.
//
// Keep the wrappers; do not inline into ComparePage.

import type { FontsRegistry } from '../types/domain.ts'
import { createLazyJsonLoader } from '../loader-factory.ts'

const fontsRegistryLoader = createLazyJsonLoader<FontsRegistry>('fonts.json')

export function loadFontsRegistry(): Promise<FontsRegistry> {
  return fontsRegistryLoader.load()
}
