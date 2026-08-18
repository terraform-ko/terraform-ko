#!/usr/bin/env node
// Re-derives what title EVERY content file should have (same logic as
// scaffold-content.mjs) and compares it against what's actually stored in each
// file's frontmatter right now. Reports any mismatch -- this catches stub files
// whose title went stale after a nav-data/algorithm fix that a re-scaffold should
// have applied but didn't (e.g. because the file was mistakenly treated as already
// translated, or a bug in the title-resolution logic itself).
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

function isTranslated(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  return !/^translated:\s*false\s*$/m.test(raw)
}

function titleFromFilename(name) {
  return name
    .replace(/\.mdx$/, '')
    .split('-')
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

function lookupPath(dirRelPath, fileKey) {
  if (fileKey === 'index') return dirRelPath
  return dirRelPath ? `${dirRelPath}/${fileKey}` : fileKey
}

let checked = 0
let mismatches = []

function walk(originDir, contentDir, dirRelPath, maps, sectionKey) {
  if (!fs.existsSync(originDir)) return
  for (const entry of fs.readdirSync(originDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name.toLowerCase() === 'partials') continue
      const childRelPath = dirRelPath ? `${dirRelPath}/${entry.name}` : entry.name
      walk(path.join(originDir, entry.name), path.join(contentDir, entry.name), childRelPath, maps, sectionKey)
      // Also check the folder's own sidebar label against its _meta.ts entry.
      const metaFile = path.join(contentDir, '_meta.ts')
      if (fs.existsSync(metaFile)) {
        const metaSrc = fs.readFileSync(metaFile, 'utf8')
        const want = maps.folderLabelByPath.get(childRelPath)
        if (want) {
          const re = new RegExp(`"${entry.name}":\\s*"([^"]*)"`)
          const m = metaSrc.match(re)
          if (m && m[1] !== want) {
            mismatches.push({ file: `${contentDir}/_meta.ts [${entry.name}]`, want, got: m[1] })
          }
        }
      }
      continue
    }
    if (!entry.name.endsWith('.mdx')) continue
    const contentFile = path.join(contentDir, entry.name)
    if (!fs.existsSync(contentFile)) continue // shouldn't happen, but skip defensively
    checked++
    const key = entry.name.replace(/\.mdx$/, '')
    const navPath = lookupPath(dirRelPath, key)
    const navTitle = maps.titleByPath.get(navPath)
    const translated = isTranslated(contentFile)
    if (translated) continue // hand-translated titles are intentionally independent
    const wantTitle =
      navTitle ?? readFrontmatterTitle(path.join(originDir, entry.name)) ?? titleFromFilename(entry.name)
    const gotTitle = readFrontmatterTitle(contentFile)
    if (wantTitle !== gotTitle) {
      mismatches.push({ file: path.relative(ROOT, contentFile), want: wantTitle, got: gotTitle })
    }
  }
}

for (const section of SECTIONS) {
  const originDir = path.join(ORIGIN_ROOT, section.origin)
  if (!fs.existsSync(originDir)) continue
  const maps = loadNavMaps(ORIGIN_ROOT, section)
  walk(originDir, path.join(CONTENT_ROOT, section.key), '', maps, section.key)
}

console.log(`Checked ${checked} untranslated stub titles + all folder labels.`)
if (mismatches.length) {
  console.log(`\n${mismatches.length} MISMATCHES:`)
  for (const m of mismatches) {
    console.log(`  ${m.file}\n    want: ${JSON.stringify(m.want)}\n    got:  ${JSON.stringify(m.got)}`)
  }
  process.exitCode = 1
} else {
  console.log('No mismatches -- every stub title and folder label matches current nav-data.')
}
