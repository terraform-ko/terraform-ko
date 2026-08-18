// Shared helpers for reading HashiCorp's own sidebar nav-data.json files
// (origin/**/data/*-nav-data.json) -- the authoritative source for official titles,
// order, and section grouping. Used by both scaffold-content.mjs (to build
// src/content/) and audit-structure.mjs (to verify src/content/ against it).
import fs from 'node:fs'
import path from 'node:path'

// key = content/<key>/..., origin = path under origin/, nav = path to the official
// nav-data.json for this section (relative to origin/), if one exists.
export const SECTIONS = [
  { key: 'cli', origin: 'terraform/docs/cli', nav: 'terraform/data/cli-nav-data.json' },
  { key: 'internals', origin: 'terraform/docs/internals', nav: 'terraform/data/internals-nav-data.json' },
  { key: 'intro', origin: 'terraform/docs/intro', nav: 'terraform/data/intro-nav-data.json' },
  { key: 'language', origin: 'terraform/docs/language', nav: 'terraform/data/language-nav-data.json' },
  {
    key: 'cloud-docs',
    origin: 'terraform-docs-common/docs/cloud-docs',
    nav: 'terraform-docs-common/data/cloud-docs-nav-data.json'
  },
  { key: 'plugin', origin: 'terraform-docs-common/docs/plugin', nav: 'terraform-docs-common/data/plugin-nav-data.json' },
  {
    key: 'registry',
    origin: 'terraform-docs-common/docs/registry',
    nav: 'terraform-docs-common/data/registry-nav-data.json'
  },
  // These four products each nest their real content one level deeper than the
  // section root (docs/<product>/...) instead of directly under docs/, unlike every
  // other section here. Pointing origin at that subfolder directly means the section
  // gets a real index.mdx at its own root (content/terraform-enterprise/index.mdx),
  // matching the live URL structure (developer.hashicorp.com/terraform/enterprise/...)
  // -- pointing at docs/ itself left the section root with no index page (404).
  {
    key: 'terraform-enterprise',
    origin: 'terraform-enterprise/docs/enterprise',
    nav: 'terraform-enterprise/data/enterprise-nav-data.json'
  },
  {
    key: 'terraform-mcp-server',
    origin: 'terraform-mcp-server/docs/mcp-server',
    nav: 'terraform-mcp-server/data/mcp-server-nav-data.json'
  },
  {
    key: 'terraform-migrate',
    origin: 'terraform-migrate/docs/migrate',
    nav: 'terraform-migrate/data/migrate-nav-data.json'
  },
  {
    key: 'terraform-policy',
    origin: 'terraform-policy/docs/policy',
    nav: 'terraform-policy/data/policy-nav-data.json'
  },
  {
    key: 'cdktf',
    origin: 'terraform-cdk/docs/cdktf',
    nav: 'terraform-cdk/data/cdktf-nav-data.json'
  },
  { key: 'docs', origin: 'terraform-docs-common/docs/docs', nav: 'terraform-docs-common/data/docs-nav-data.json' }
]

export function stripTags(title) {
  return title.replace(/<[^>]+>/g, '')
}

// path relative to a section root ("" = the section's own index.mdx) -> does a real
// origin file exist for it? Shared by normalizeHref's relative-href detection below
// and by audit-structure.mjs's own report.
export function fileExistsForPath(originSectionDir, navPath) {
  const base = navPath ? path.join(originSectionDir, navPath) : path.join(originSectionDir, 'index')
  return fs.existsSync(`${base}.mdx`) || fs.existsSync(path.join(base, 'index.mdx'))
}

// Normalizes a nav-data href to a path relative to this section's root, or null
// if the href points outside this section (cross-product link / external URL).
export function normalizeHref(href, sectionKey, pathExists = () => true) {
  if (href.startsWith('/')) {
    let p = href
    if (p.startsWith('/terraform/')) p = p.slice('/terraform'.length)
    else if (p === '/terraform') p = ''
    const prefix = `/${sectionKey}`
    if (p === prefix) return ''
    if (p.startsWith(`${prefix}/`)) return p.slice(prefix.length + 1)
    return null
  }
  // A handful of HashiCorp's own nav-data hrefs are already section-relative paths
  // with no leading slash (e.g. "block/locals" inside language's "Stack blocks", or
  // "variables/managing-variables" in cloud-docs) rather than full site paths. But a
  // few plugin-nav-data entries (sdkv2/framework/log/mux/testing) use this exact same
  // bare-relative shape to point at genuinely separate doc sets HashiCorp doesn't
  // publish through web-unified-docs at all (they're their own GitHub repos, not
  // mirrored under origin/) -- pathExists distinguishes a real same-section
  // cross-reference from one of those.
  if (/^([a-z][a-z0-9+.-]*:|#)/i.test(href)) return null
  return pathExists(href) ? href : null
}

function commonPrefix(paths) {
  const split = paths.map(p => (p ? p.split('/') : []))
  let prefix = split[0]
  for (const s of split.slice(1)) {
    let i = 0
    while (i < prefix.length && i < s.length && prefix[i] === s[i]) i++
    prefix = prefix.slice(0, i)
  }
  return prefix
}

// Returns { titleByPath, folderLabelByPath, orderByPath, extraRefsByPath,
// headingsByPath, tree }, all keyed by path relative to the section root ("" = the
// section's own index.mdx / section root folder). orderByPath records the position
// each path appears in HashiCorp's own nav-data -- that's the real sidebar order,
// which does NOT match alphabetical filename order. `tree` is the raw nested
// structure (title/path/href/routes/children) for documentation purposes.
//
// Group -> folder resolution runs in two passes. A group's routes often mix pages
// that live under one shared folder with a couple of one-off cross-references to
// pages that already live under a DIFFERENT group's folder (e.g. language's
// "Configure providers" group lists providers/*, but also throws in the standalone
// "provider block reference" page that actually lives under the unrelated "block/"
// folder, which is its own group). Naively requiring every route in a group to share
// one path prefix fails on the cross-references and leaves the whole group
// unresolved. Pass 1 resolves every group whose full route set already shares a
// prefix. Pass 2 retries the rest, ignoring routes already claimed by a pass-1
// group -- once "block/provider" is excluded, "Configure providers" cleanly
// resolves to "providers".
//
// Those excluded cross-references aren't dropped, though: extraRefsByPath records
// them per resolved folder (official genuinely lists the same page under more than
// one group -- e.g. "provider block reference" appears both here and under
// "Configuration blocks") so scaffold-content.mjs can add a second sidebar entry for
// each, routed through the /_ref/ redirect (see next.config.mjs) since Nextra's
// sidebar breaks if the same route is referenced from two meta entries directly.
export function parseNavData(navData, sectionKey, isDir = () => true, pathExists = () => true) {
  const titleByPath = new Map()
  const folderLabelByPath = new Map()
  const orderByPath = new Map()
  const extraRefsByPath = new Map()
  const headingsByPath = new Map()
  let counter = 0

  function order(p) {
    if (!orderByPath.has(p)) orderByPath.set(p, counter++)
  }

  // Every route ever listed via a `path`-type node anywhere in the tree. An href-type
  // node whose resolved path is IN this set is definitely a cross-reference alias to
  // that page's real listing elsewhere (e.g. "locals" -> block/locals inside "Stack
  // blocks", when block/locals also has its own `path`-type entry under "Configuration
  // blocks"). One that's NOT in this set has no path-type listing anywhere -- for those
  // (e.g. several of cli's "stacks" commands, which HashiCorp defines via href instead
  // of path for their whole subtree) the href IS the primary/only listing, and should
  // set the page's title same as a path-type node would.
  const realPaths = new Set()
  function collectRealPaths(nodes) {
    for (const node of nodes) {
      if (typeof node.path === 'string') realPaths.add(node.path)
      if (node.routes) collectRealPaths(node.routes)
    }
  }
  collectRealPaths(navData)

  // Collect every routes-group in the tree (any depth) with its own immediate
  // path-typed children, keyed by node identity for the two-pass resolution below.
  const groupChildPaths = new Map()
  function collectGroups(nodes) {
    for (const node of nodes) {
      if (!node.routes) continue
      groupChildPaths.set(
        node,
        node.routes.filter(r => typeof r.path === 'string').map(r => r.path)
      )
      collectGroups(node.routes)
    }
  }
  collectGroups(navData)

  // A group with exactly one direct child often lists that child because it IS the
  // group's own index page (e.g. cli's "Initializing Working Directories" -> "init",
  // whose one path child is literally "init" itself, a real folder). But sometimes
  // that one child is a deeper leaf file rather than the group's index (e.g.
  // language's "Query blocks" -> its one path child is "block/tfquery/list", a real
  // .mdx file one level *inside* the folder the group should actually resolve to).
  // commonPrefix() can't tell these apart from path strings alone, since a
  // single-element array's "common prefix" is trivially the whole path. isDir()
  // (backed by the real origin/ filesystem) can: walk up from the naive prefix until
  // landing on a path that's an actual directory (or the section root).
  function correctToRealDir(prefixPath) {
    let p = prefixPath
    while (p !== '' && !isDir(p)) {
      const idx = p.lastIndexOf('/')
      p = idx === -1 ? '' : p.slice(0, idx)
    }
    return p
  }

  const resolvedPrefix = new Map()
  const claimed = new Set()
  for (const [node, childPaths] of groupChildPaths) {
    if (!childPaths.length) continue
    const prefix = commonPrefix(childPaths)
    if (!prefix.length) continue
    const prefixPath = correctToRealDir(prefix.join('/'))
    if (!prefixPath) continue
    resolvedPrefix.set(node, prefixPath)
    claimed.add(prefixPath)
    for (const p of childPaths) claimed.add(p)
  }
  for (const [node, childPaths] of groupChildPaths) {
    if (resolvedPrefix.has(node)) continue
    const ownPaths = childPaths.filter(p => !claimed.has(p) && ![...claimed].some(c => p.startsWith(`${c}/`)))
    if (ownPaths.length < 2) continue // a single leftover page doesn't need its own folder
    const prefix = commonPrefix(ownPaths)
    if (!prefix.length) continue
    const prefixPath = correctToRealDir(prefix.join('/'))
    if (!prefixPath) continue
    resolvedPrefix.set(node, prefixPath)
  }
  // Pass 3: a group made up entirely of OTHER groups, with no direct path children of
  // its own (e.g. language's "Stack blocks" wraps "Component configuration" +
  // "Deployment configuration", each already resolved above to
  // block/stack/tfcomponent / block/stack/tfdeploy) -- resolve it to their shared
  // parent directory. Looped since a group-of-groups can itself be wrapped by another.
  for (let changed = true; changed; ) {
    changed = false
    for (const [node, childPaths] of groupChildPaths) {
      if (resolvedPrefix.has(node) || childPaths.length) continue
      const subPrefixes = (node.routes || []).filter(r => r.routes).map(r => resolvedPrefix.get(r)).filter(Boolean)
      if (subPrefixes.length < 2) continue
      const prefix = commonPrefix(subPrefixes)
      if (!prefix.length) continue
      const prefixPath = correctToRealDir(prefix.join('/'))
      if (!prefixPath) continue
      resolvedPrefix.set(node, prefixPath)
      changed = true
    }
  }

  function isUnder(childPath, folderPath) {
    return childPath === folderPath || childPath.startsWith(`${folderPath}/`)
  }

  // dirContext is the resolved folder path this batch of siblings physically lives
  // in ('' for the section root), or null when we're inside a group that never
  // resolved to a real folder (nothing to attach headings/cross-refs to).
  function walk(nodes, dirContext) {
    const out = []
    for (const node of nodes) {
      if (node.heading) {
        const entry = { title: stripTags(node.heading), order: counter++ }
        if (dirContext !== null) {
          if (!headingsByPath.has(dirContext)) headingsByPath.set(dirContext, [])
          headingsByPath.get(dirContext).push(entry)
        }
        out.push({ kind: 'heading', title: entry.title })
        continue
      }
      if (node.divider) {
        out.push({ kind: 'divider' })
        continue
      }
      if (node.routes) {
        const prefixPath = resolvedPrefix.get(node) ?? null
        if (prefixPath !== null) {
          folderLabelByPath.set(prefixPath, stripTags(node.title))
          order(prefixPath)
        }
        out.push({
          kind: 'group',
          title: stripTags(node.title),
          path: prefixPath,
          children: walk(node.routes, prefixPath)
        })
        continue
      }
      if (typeof node.path === 'string') {
        titleByPath.set(node.path, stripTags(node.title))
        order(node.path)
        if (dirContext !== null && dirContext !== '' && !isUnder(node.path, dirContext)) {
          // Official lists this same page a second time, under a group it doesn't
          // physically live in (e.g. "provider block reference" also shown under
          // "Configure providers", though the file lives under block/). orderByPath
          // only records the *first* occurrence's document position, which is wrong
          // for a second listing that appears somewhere else entirely (e.g. "Query
          // blocks" re-lists items first introduced way earlier, under "Configuration
          // blocks") -- a small fractional offset off the current counter preserves
          // this listing's own local position (right after whatever real sibling
          // preceded it in this same group) without disturbing orderByPath itself.
          if (!extraRefsByPath.has(dirContext)) extraRefsByPath.set(dirContext, [])
          const bucket = extraRefsByPath.get(dirContext)
          bucket.push({ path: node.path, title: stripTags(node.title), order: counter + bucket.length * 0.0001 })
        }
        out.push({ kind: 'page', title: stripTags(node.title), path: node.path })
      } else if (typeof node.href === 'string') {
        const rel = normalizeHref(node.href, sectionKey, pathExists)
        if (rel !== null) {
          // Only treat this href as authoritative for the page's title if no
          // `path`-type node anywhere else already owns this route -- otherwise this
          // is a cross-reference alias (see realPaths above), and titleByPath.set
          // being unconditional (last-write-wins) would let an alias's often-shorter
          // "summary card" title (e.g. "Setup") corrupt the real listing's title
          // whenever the alias happens to be traversed after it. The alias keeps its
          // own title only locally, via the extraRefsByPath push below.
          if (!realPaths.has(rel)) titleByPath.set(rel, stripTags(node.title))
          order(rel)
          if (dirContext !== null && dirContext !== '' && !isUnder(rel, dirContext)) {
            if (!extraRefsByPath.has(dirContext)) extraRefsByPath.set(dirContext, [])
            const bucket = extraRefsByPath.get(dirContext)
            bucket.push({ path: rel, title: stripTags(node.title), order: counter + bucket.length * 0.0001 })
          }
        }
        out.push({ kind: 'link', title: stripTags(node.title), href: node.href, internal: rel !== null, path: rel })
      }
    }
    return out
  }

  const tree = walk(navData, '')
  return { titleByPath, folderLabelByPath, orderByPath, extraRefsByPath, headingsByPath, tree }
}

export function loadNavMaps(originRoot, section) {
  const navPath = path.join(originRoot, section.nav)
  if (!fs.existsSync(navPath)) {
    return {
      titleByPath: new Map(),
      folderLabelByPath: new Map(),
      orderByPath: new Map(),
      extraRefsByPath: new Map(),
      headingsByPath: new Map(),
      tree: []
    }
  }
  const navData = JSON.parse(fs.readFileSync(navPath, 'utf8'))
  const originSectionDir = path.join(originRoot, section.origin)
  function isDir(relPath) {
    if (relPath === '') return true
    try {
      return fs.statSync(path.join(originSectionDir, relPath)).isDirectory()
    } catch {
      return false
    }
  }
  function pathExists(relPath) {
    return isDir(relPath) || fileExistsForPath(originSectionDir, relPath)
  }
  return parseNavData(navData, section.key, isDir, pathExists)
}
