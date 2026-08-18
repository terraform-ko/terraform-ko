#!/usr/bin/env node
// Walks each origin/ product section and creates matching (empty/untranslated) stub
// files under src/content for every page that doesn't have a translation yet.
// Existing files under src/content are never overwritten.
//
// Titles come from HashiCorp's own sidebar nav-data.json files (origin/**/data/*-nav-data.json)
// wherever available -- those are the authoritative official labels (folder/file names alone
// are often wrong, e.g. "vs/" is officially "Terraform vs. Alternatives", not "Vs").
// Falls back to frontmatter title / first heading / filename when nav-data has no entry.
//
// Also (re)generates _meta.ts for every directory. Run again after `origin/` is re-synced
// to pick up new pages or new official titles.
import fs from 'node:fs'
import path from 'node:path'
import { SECTIONS, loadNavMaps } from './lib/nav-data.mjs'

const ROOT = path.join(import.meta.dirname, '..')
const ORIGIN_ROOT = path.join(ROOT, 'origin')
const CONTENT_ROOT = path.join(ROOT, 'src', 'content')

function readFrontmatterTitle(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n')
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/)
  const body = fmMatch ? raw.slice(fmMatch[0].length) : raw
  if (fmMatch) {
    const titleMatch = fmMatch[1].match(/^(?:title|page_title):\s*(.+)$/m)
    if (titleMatch) return titleMatch[1].trim().replace(/^["']|["']$/g, '')
  }
  const heading = body.match(/^#\s+(.+)$/m)
  if (heading) return heading[1].trim()
  return null
}

function titleFromFilename(name) {
  return name
    .replace(/\.mdx$/, '')
    .split('-')
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

function ensureStub(originFile, contentFile, title) {
  if (fs.existsSync(contentFile)) return false // never overwrite a real translation
  fs.mkdirSync(path.dirname(contentFile), { recursive: true })
  const relSource = path.relative(ORIGIN_ROOT, originFile).replaceAll('\\', '/')
  const urlPath = relSource
    .replace(/^terraform\/docs\//, '')
    .replace(/^terraform-docs-common\/docs\//, '')
    .replace(/^terraform-enterprise\/docs\//, 'enterprise/')
    .replace(/^terraform-mcp-server\/docs\//, 'mcp-server/')
    .replace(/^terraform-migrate\/docs\//, 'migrate/')
    .replace(/^terraform-policy\/docs\//, 'policy/')
    .replace(/^terraform-cdk\/docs\//, 'cdktf/')
    .replace(/\/index\.mdx$/, '')
    .replace(/\.mdx$/, '')
  fs.writeFileSync(
    contentFile,
    `---
title: ${JSON.stringify(title)}
translated: false
source: ${JSON.stringify(relSource)}
---

> 🚧 이 문서는 아직 번역되지 않았습니다. 번역에 참여하려면 [CONTRIBUTING.md](https://github.com/terraform-ko/terraform-ko/blob/main/CONTRIBUTING.md)를 확인해주세요.
> 원문: [${relSource}](https://developer.hashicorp.com/terraform/${urlPath})
`
  )
  return true
}

// HashiCorp's own source occasionally has a duplicate/orphan file sitting next to
// its real one (same content, not referenced by nav-data) that happens to collide
// with a sibling path under Nextra's naive identifier generation (dir + name with
// "/" and "-" both sanitized to "_"). These are skipped entirely.
const EXCLUDE_ORIGIN_PATHS = new Set([
  'terraform-enterprise/docs/enterprise/registry/manage-module-versions.mdx'
])

function lookupPath(dirRelPath, fileKey) {
  if (fileKey === 'index') return dirRelPath
  return dirRelPath ? `${dirRelPath}/${fileKey}` : fileKey
}

// A few official sidebar groups have zero shared physical folder among their member
// pages at all (genuinely scattered files) -- e.g. language's "Extend CRUD operations"
// groups invoke-actions.mdx, post-apply-operations.mdx and provisioners.mdx, three
// unrelated section-root files, "Syntax" groups attr-as-blocks.mdx (also at the root)
// into the otherwise-unrelated syntax/ folder, and "Variables"/"Locals"/"Outputs" each
// promote one page out of the values/ folder into their own new top-level group. The
// two-pass folder resolution in nav-data.mjs can only relabel a folder that already
// exists in origin/; it can't invent one out of scattered files. These are relocated
// by hand to physically match the official grouping. This is a deliberate, narrow
// exception to this project's usual "content mirrors origin path-for-path" rule --
// matching the official sidebar's nesting was judged more valuable than preserving
// these specific pages' origin-mirrored URL segment. `fromDir` defaults to the section
// root (''); `toDir` is always a new or existing folder at the section root.
const MANUAL_MOVES = {
  language: [
    { file: 'invoke-actions', toDir: 'extend-crud-operations' },
    { file: 'post-apply-operations', toDir: 'extend-crud-operations' },
    { file: 'provisioners', toDir: 'extend-crud-operations' },
    { file: 'attr-as-blocks', toDir: 'syntax' },
    { fromDir: 'values', file: 'variables', toDir: 'variables' },
    { fromDir: 'values', file: 'locals', toDir: 'locals' },
    { fromDir: 'values', file: 'outputs', toDir: 'outputs' }
  ]
}
// Label for a manually-created folder that has no nav-data-resolved label of its own
// (a brand new folder, not an existing one being relabeled).
const MANUAL_GROUP_TITLES = {
  'language/extend-crud-operations': 'Extend CRUD operations',
  'language/variables': 'Variables',
  'language/locals': 'Locals',
  'language/outputs': 'Outputs'
}
// Second sidebar listings that can't be discovered automatically because they belong
// to a manually-created virtual folder above (nav-data.mjs's cross-reference detection
// only runs for groups that resolve to a *real* folder). Same /_ref/ redirect
// mechanism as the automatic ones -- see next.config.mjs.
const MANUAL_EXTRA_REFS = {
  'language/variables': [{ path: 'block/variable', title: 'variable block reference' }],
  'language/locals': [{ path: 'block/locals', title: 'locals block reference' }],
  'language/outputs': [{ path: 'block/output', title: 'output block reference' }]
}
// Folders left behind by MANUAL_MOVES that end up with no official sidebar grouping of
// their own (official doesn't show a "Values" folder at all -- it only ever surfaces
// the pages that used to live in it, promoted elsewhere per MANUAL_MOVES above).
// Hidden rather than deleted: still routable, just not listed.
const HIDDEN_PATHS = {
  language: ['values']
}

function buildFileEntry(originFile, contentFile, navPath, maps, fallbackName) {
  const navTitle = maps.titleByPath.get(navPath)
  const alreadyTranslated = fs.existsSync(contentFile)
  const title = alreadyTranslated
    ? (readFrontmatterTitle(contentFile) ?? navTitle ?? readFrontmatterTitle(originFile) ?? titleFromFilename(fallbackName))
    : (navTitle ?? readFrontmatterTitle(originFile) ?? titleFromFilename(fallbackName))
  let created = 0
  if (!alreadyTranslated) {
    ensureStub(originFile, contentFile, title)
    created = 1
  }
  return { title, order: maps.orderByPath.get(navPath), created }
}

function writeMetaFile(contentDir, metaEntries, indexTitle) {
  const keys = Object.keys(metaEntries)
  keys.sort((a, b) => {
    const oa = metaEntries[a].order
    const ob = metaEntries[b].order
    if (oa === undefined && ob === undefined) return 0
    if (oa === undefined) return 1
    if (ob === undefined) return -1
    return oa - ob
  })
  const ordered = {}
  if (indexTitle !== undefined) ordered.index = indexTitle
  for (const key of keys) {
    const e = metaEntries[key]
    if (e.hidden) {
      ordered[key] = { display: 'hidden' }
    } else if (e.type === 'separator') {
      ordered[key] = { type: 'separator', title: e.title }
    } else if (e.href) {
      ordered[key] = { title: e.title, href: e.href }
    } else {
      ordered[key] = e.title
    }
  }
  fs.mkdirSync(contentDir, { recursive: true })
  fs.writeFileSync(path.join(contentDir, '_meta.ts'), `export default ${JSON.stringify(ordered, null, 2)}\n`)
}

// Builds a folder that exists only in src/content/ (no origin/ counterpart of its
// own) out of files pulled in from elsewhere via MANUAL_MOVES, plus any manually
// declared cross-references (MANUAL_EXTRA_REFS) that belong in it.
function buildVirtualDir(contentDir, files, maps, extraRefs = [], sectionKey) {
  let created = 0
  const metaEntries = {}
  for (const f of files) {
    const contentFile = path.join(contentDir, `${f.key}.mdx`)
    const entry = buildFileEntry(f.originFile, contentFile, f.navPath, maps, f.key)
    created += entry.created
    metaEntries[f.key] = entry
  }
  for (const ref of extraRefs) {
    const key = `_ref_${ref.path.replace(/[^a-zA-Z0-9]/g, '_')}`
    metaEntries[key] = {
      title: ref.title,
      href: `/_ref/${sectionKey}/${ref.path}`,
      order: maps.orderByPath.get(ref.path)
    }
  }
  writeMetaFile(contentDir, metaEntries)
  return created
}

// A handful of spots in HashiCorp's own source have both "name.mdx" and a "name/"
// folder as siblings (e.g. api-docs/notification-configurations.mdx next to
// api-docs/notification-configurations/{project,team,workspace}.mdx). Both dirents
// share the same _meta.ts key, so whichever was processed second silently clobbered
// the other's title -- the folder's real label ("Notification Configurations") was
// getting overwritten by the flat file's own leaf title ("Overview"). If the folder
// has no index.mdx of its own, the flat file IS meant to be its index (this function
// arranges for it to be read from there instead). If the folder already has a real
// index.mdx, the flat file is a duplicate/orphan (same content, stale timestamp) and
// is skipped entirely -- mirrors the manage-module-versions case in
// EXCLUDE_ORIGIN_PATHS, just detected generically instead of hardcoded per path.
function resolveSyntheticIndex(originDir, dirEntryNames) {
  const map = new Map() // dirName -> sibling flat file path to treat as its index.mdx
  const skip = new Set() // flat file names to exclude outright (orphan duplicates)
  for (const dirName of dirEntryNames) {
    const flatFile = path.join(originDir, `${dirName}.mdx`)
    if (!fs.existsSync(flatFile)) continue
    const hasOwnIndex = fs.existsSync(path.join(originDir, dirName, 'index.mdx'))
    if (hasOwnIndex) {
      skip.add(`${dirName}.mdx`)
    } else {
      map.set(dirName, flatFile)
    }
  }
  return { map, skip }
}

function walkDir(originDir, contentDir, dirRelPath, maps, sectionKey, syntheticIndexFile, injectFiles = []) {
  const entries = fs.readdirSync(originDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  let created = 0
  // key -> { title, order }
  const metaEntries = {}

  const dirEntryNames = entries
    .filter(e => e.isDirectory() && e.name.toLowerCase() !== 'partials')
    .map(e => e.name)
  const { map: syntheticIndexByDir, skip: skipFlatFiles } = resolveSyntheticIndex(originDir, dirEntryNames)

  // Files manually relocated elsewhere (see MANUAL_MOVES) are excluded from whichever
  // directory they're moved OUT of (fromDir, defaulting to the section root) -- never
  // moved in here directly (a directory's own `injectFiles` param is how it receives
  // them when its name happens to match an existing toDir, see below).
  const allMoves = MANUAL_MOVES[sectionKey] || []
  const moves = allMoves.filter(m => (m.fromDir || '') === dirRelPath)
  const excludeFileKeys = new Set(moves.map(m => m.file))
  // Target folders are always created once, at the section root, regardless of which
  // directory their source files were moved out of.
  const injectByDir = new Map()
  if (dirRelPath === '') {
    for (const m of allMoves) {
      if (!injectByDir.has(m.toDir)) injectByDir.set(m.toDir, [])
      const fromDir = m.fromDir || ''
      injectByDir.get(m.toDir).push({
        key: m.file,
        originFile: path.join(originDir, fromDir, `${m.file}.mdx`),
        navPath: fromDir ? `${fromDir}/${m.file}` : m.file
      })
    }
  }

  if (syntheticIndexFile) {
    const contentFile = path.join(contentDir, 'index.mdx')
    const entry = buildFileEntry(syntheticIndexFile, contentFile, dirRelPath, maps, 'Overview')
    created += entry.created
    metaEntries.index = entry
  }

  for (const inj of injectFiles) {
    const contentFile = path.join(contentDir, `${inj.key}.mdx`)
    const entry = buildFileEntry(inj.originFile, contentFile, inj.navPath, maps, inj.key)
    created += entry.created
    metaEntries[inj.key] = entry
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // "partials" holds HashiCorp's include-fragments, not standalone pages -- skip.
      if (entry.name.toLowerCase() === 'partials') continue
      const childRelPath = dirRelPath ? `${dirRelPath}/${entry.name}` : entry.name
      created += walkDir(
        path.join(originDir, entry.name),
        path.join(contentDir, entry.name),
        childRelPath,
        maps,
        sectionKey,
        syntheticIndexByDir.get(entry.name),
        injectByDir.get(entry.name) ?? []
      )
      metaEntries[entry.name] = {
        title: maps.folderLabelByPath.get(childRelPath) ?? titleFromFilename(entry.name),
        order: maps.orderByPath.get(childRelPath),
        hidden: (HIDDEN_PATHS[sectionKey] || []).includes(childRelPath)
      }
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      const key = entry.name.replace(/\.mdx$/, '')
      if (skipFlatFiles.has(entry.name) || syntheticIndexByDir.has(key) || excludeFileKeys.has(key)) continue
      const originFile = path.join(originDir, entry.name)
      const originRel = path.relative(ORIGIN_ROOT, originFile).replaceAll('\\', '/')
      if (EXCLUDE_ORIGIN_PATHS.has(originRel)) continue
      const contentFile = path.join(contentDir, entry.name)
      const navPath = lookupPath(dirRelPath, key)
      const fileEntry = buildFileEntry(originFile, contentFile, navPath, maps, entry.name)
      created += fileEntry.created
      metaEntries[key] = fileEntry
    }
  }

  // Brand-new folders that have no origin/ counterpart at all (their target
  // directory name never appeared among `entries` above, so the recursive call that
  // would normally build them never happened).
  for (const [toDir, files] of injectByDir) {
    if (dirEntryNames.includes(toDir)) continue
    const virtualContentDir = path.join(contentDir, toDir)
    const extraRefs = MANUAL_EXTRA_REFS[`${sectionKey}/${toDir}`] || []
    created += buildVirtualDir(virtualContentDir, files, maps, extraRefs, sectionKey)
    metaEntries[toDir] = {
      title: MANUAL_GROUP_TITLES[`${sectionKey}/${toDir}`] ?? titleFromFilename(toDir),
      order: Math.min(...files.map(f => maps.orderByPath.get(f.navPath) ?? Infinity))
    }
  }

  // Second sidebar listings for pages that physically live elsewhere (official lists
  // the same page under more than one group -- e.g. "provider block reference" shows
  // under both "Configuration blocks" and "Configure providers"). Routed through
  // /_ref/ since Nextra's sidebar breaks when the same real route is referenced from
  // two meta entries directly (see next.config.mjs).
  const extraRefs = maps.extraRefsByPath.get(dirRelPath) || []
  for (const ref of extraRefs) {
    const key = `_ref_${ref.path.replace(/[^a-zA-Z0-9]/g, '_')}`
    metaEntries[key] = {
      title: ref.title,
      href: `/_ref/${sectionKey}/${ref.path}`,
      order: ref.order
    }
  }

  // Section heading dividers (e.g. language's "UPGRADE" / "REFERENCE") from the
  // official sidebar.
  const headings = maps.headingsByPath.get(dirRelPath) || []
  for (const h of headings) {
    const key = `_heading_${h.order}`
    metaEntries[key] = { type: 'separator', title: h.title, order: h.order }
  }

  const indexTitle = 'index' in metaEntries ? metaEntries.index.title : undefined
  const rest = Object.fromEntries(Object.entries(metaEntries).filter(([k]) => k !== 'index'))
  writeMetaFile(contentDir, rest, indexTitle)

  return created
}

let totalCreated = 0
for (const section of SECTIONS) {
  const originDir = path.join(ORIGIN_ROOT, section.origin)
  if (!fs.existsSync(originDir)) continue
  const maps = loadNavMaps(ORIGIN_ROOT, section)
  totalCreated += walkDir(originDir, path.join(CONTENT_ROOT, section.key), '', maps, section.key)
}

console.log(`Created ${totalCreated} stub file(s). Existing translations were left untouched.`)
