#!/usr/bin/env node
// Walks every .mdx file under src/content, computes its route, and fetches it from a
// running local server (default http://localhost:3000) to confirm every single page
// actually resolves (not just a sample). Prints any non-200 result.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(import.meta.dirname, '..')
const CONTENT_ROOT = path.join(ROOT, 'src', 'content')
const BASE = process.env.BASE_URL || 'http://localhost:3000'
const CONCURRENCY = 20

function collectRoutes(dir, relDir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      collectRoutes(path.join(dir, entry.name), relDir ? `${relDir}/${entry.name}` : entry.name, out)
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      const key = entry.name.replace(/\.mdx$/, '')
      const route =
        key === 'index'
          ? relDir
            ? `/${relDir}`
            : '/'
          : relDir
            ? `/${relDir}/${key}`
            : `/${key}`
      out.push(route)
    }
  }
}

const routes = []
collectRoutes(CONTENT_ROOT, '', routes)
routes.sort()

console.log(`Checking ${routes.length} routes against ${BASE} ...`)

let done = 0
const failures = []
async function checkOne(route) {
  try {
    const res = await fetch(BASE + route)
    if (res.status !== 200) failures.push({ route, status: res.status })
  } catch (e) {
    failures.push({ route, status: `ERROR: ${e.message}` })
  }
  done++
  if (done % 100 === 0) console.log(`  ${done}/${routes.length}`)
}

async function run() {
  for (let i = 0; i < routes.length; i += CONCURRENCY) {
    const batch = routes.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map(checkOne))
  }
  console.log(`\nDone. ${routes.length - failures.length}/${routes.length} OK.`)
  if (failures.length) {
    console.log(`\n${failures.length} FAILURES:`)
    for (const f of failures) console.log(`  ${f.status}  ${f.route}`)
    process.exitCode = 1
  } else {
    console.log('No failures.')
  }
}

run()
