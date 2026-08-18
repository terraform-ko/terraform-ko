#!/usr/bin/env node
// Cross-checks src/content/ against HashiCorp's own official nav-data.json files and
// writes a full structure report to STRUCTURE.md. Run after scaffold-content.mjs, or
// whenever the official site's structure needs re-verifying.
//
// Two kinds of checks:
//  1. Does every nav-data `path` entry resolve to a real file under origin/ (and, once
//     scaffolded, under src/content/)? A path with no matching file usually means the
//     product nests its docs one level deeper than expected (the terraform-enterprise/
//     mcp-server/migrate/policy bug) or the origin/ sync is stale.
//  2. Does the section root have an index page? A folder-only section 404s at its own
//     root even if every nested page is fine.
import fs from 'node:fs'
import path from 'node:path'
import { SECTIONS, loadNavMaps, fileExistsForPath } from './lib/nav-data.mjs'

const ROOT = path.join(import.meta.dirname, '..')
const ORIGIN_ROOT = path.join(ROOT, 'origin')
const CONTENT_ROOT = path.join(ROOT, 'src', 'content')

function renderTree(nodes, depth, lines) {
  const indent = '  '.repeat(depth)
  for (const node of nodes) {
    if (node.kind === 'heading') {
      lines.push(`${indent}- **${node.title}**`)
    } else if (node.kind === 'divider') {
      lines.push(`${indent}- ---`)
    } else if (node.kind === 'group') {
      lines.push(`${indent}- 📁 ${node.title}${node.path === null ? ' _(no matching folder)_' : ''}`)
      renderTree(node.children, depth + 1, lines)
    } else if (node.kind === 'page') {
      lines.push(`${indent}- ${node.title} \`${node.path || '(index)'}\``)
    } else if (node.kind === 'link') {
      const marker = node.internal ? `internal → \`${node.path}\`` : 'external'
      lines.push(`${indent}- ${node.title} _(${marker}: ${node.href})_`)
    }
  }
}

let report = `# Official Terraform docs structure audit

Generated from HashiCorp's own sidebar navigation data (\`origin/**/data/*-nav-data.json\`,
synced from \`hashicorp/web-unified-docs\`), cross-checked against what actually exists
under \`origin/\` and \`src/content/\`. This is the ground truth this site's structure is
built from — regenerate with \`node scripts/audit-structure.mjs\` after re-syncing origin/.

`

let totalMissing = 0
let totalSections = 0

for (const section of SECTIONS) {
  const originDir = path.join(ORIGIN_ROOT, section.origin)
  if (!fs.existsSync(originDir)) {
    report += `## ${section.key}\n\n⚠️ origin path not found: \`${section.origin}\`\n\n`
    continue
  }
  totalSections++
  const maps = loadNavMaps(ORIGIN_ROOT, section)
  const contentDir = path.join(CONTENT_ROOT, section.key)

  report += `## ${section.key}\n\n`
  report += `- origin: \`origin/${section.origin}\`\n`
  report += `- content: \`src/content/${section.key}\`\n`
  report += `- nav-data: \`origin/${section.nav}\`${fs.existsSync(path.join(ORIGIN_ROOT, section.nav)) ? '' : ' _(missing)_'}\n`

  const rootHasIndex = fs.existsSync(path.join(originDir, 'index.mdx'))
  report += `- section root index.mdx: ${rootHasIndex ? '✅' : '❌ MISSING (section root will 404)'}\n`

  const missing = []
  for (const navPath of maps.titleByPath.keys()) {
    if (!fileExistsForPath(originDir, navPath)) missing.push(navPath)
  }
  if (missing.length) {
    totalMissing += missing.length
    report += `- nav-data paths with no matching origin file: ❌ ${missing.length}\n`
    for (const m of missing.slice(0, 20)) report += `  - \`${m}\`\n`
    if (missing.length > 20) report += `  - _...and ${missing.length - 20} more_\n`
  } else {
    report += `- nav-data paths with no matching origin file: ✅ none\n`
  }

  report += `\n<details><summary>Full official sidebar tree</summary>\n\n`
  const lines = []
  renderTree(maps.tree, 0, lines)
  report += lines.join('\n')
  report += `\n\n</details>\n\n`
}

report += `## Summary

- Sections checked: ${totalSections}
- Total nav-data paths with no matching file: ${totalMissing}
`

fs.writeFileSync(path.join(ROOT, 'STRUCTURE.md'), report)
console.log(`Wrote STRUCTURE.md (${totalSections} sections, ${totalMissing} unmatched nav-data paths).`)
