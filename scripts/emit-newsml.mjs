// Emits the spoke repository via the newsmlg2 library API.
// BlogByline is an Astro layout component — it has no meaning outside the
// site render, so it is stripped before the markdown body becomes XHTML.
import { readFileSync } from 'node:fs'
import { load as yamlLoad } from 'js-yaml'
import { marked } from 'marked'
import { emitNewsml, loadMarkdownPosts, validateOutput } from 'newsmlg2'

const cfg = yamlLoad(readFileSync('spoke.yaml', 'utf8'))
const n = emitNewsml({
  spoke: { id: cfg.id, name: cfg.name, base: cfg.base },
  posts: loadMarkdownPosts({ contentDir: cfg.contentDir }),
  outDir: cfg.outDir,
  renderBody: (md) => marked.parse(md.replaceAll('<BlogByline />', ''), { async: false }),
})
const errors = validateOutput(cfg.outDir)
if (errors.length) {
  for (const e of errors) console.error(`newsml: ${e}`)
  process.exit(1)
}
console.log(`newsml: ${n} item(s) -> ${cfg.outDir}`)
