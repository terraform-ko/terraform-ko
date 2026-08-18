const HC = 'https://developer.hashicorp.com'

export default {
  index: '소개',
  install: {
    title: 'Install',
    href: `${HC}/terraform/install`
  },
  intro: 'Intro to Terraform',
  tutorials: {
    title: 'Tutorials',
    href: `${HC}/terraform/tutorials`
  },
  'doc-separator': {
    type: 'separator',
    title: 'Documentation'
  },
  docs: 'Documentation',
  language: 'Configuration Language',
  cli: 'Terraform CLI',
  'cloud-docs': 'HCP Terraform',
  'terraform-enterprise': 'Terraform Enterprise',
  'terraform-mcp-server': 'Terraform MCP Server',
  'terraform-migrate': 'Terraform Migrate',
  // Routed through /provider-use (a plain redirect in next.config.mjs) rather than
  // href: '/language/providers' directly -- Nextra's sidebar merges a meta `href`
  // alias with the matching pageMap node when the href hits an existing *folder*
  // route, inheriting its children and rendering as an expand-toggle instead of a
  // link (verified in Chrome: clicking it opened "Configuration Language" instead of
  // navigating). Going through a route with no matching page avoids the collision.
  'provider-use': {
    title: 'Provider Use',
    href: '/provider-use'
  },
  'terraform-policy': 'Terraform Policy (BETA)',
  plugin: 'Plugin Development',
  registry: 'Registry Publishing',
  'resource-separator': {
    type: 'separator',
    title: 'Resources'
  },
  'tutorial-library': {
    title: 'Tutorial Library',
    href: `${HC}/tutorials/library?product=terraform`
  },
  certifications: {
    title: 'Certifications',
    href: `${HC}/certifications/infrastructure-automation`
  },
  sandbox: {
    title: 'Sandbox',
    href: `${HC}/terraform/sandbox`
  },
  'community-forum': {
    title: 'Community Forum',
    href: 'https://discuss.hashicorp.com/c/terraform-core/27'
  },
  support: {
    title: 'Support',
    href: 'https://github.com/terraform-ko/terraform-ko/issues'
  },
  github: {
    title: 'GitHub',
    href: 'https://github.com/terraform-ko/terraform-ko'
  },
  'terraform-registry': {
    title: 'Terraform Registry',
    href: 'https://registry.terraform.io'
  },
  // Not one of the 12 items in the main /terraform sidebar's Documentation dropdown,
  // but confirmed (Chrome, live site) to appear as a real cross-link at the bottom of
  // the Configuration Language sidebar -- hiding it entirely was wrong. Listed here
  // instead since this site doesn't do official's per-section contextual sidebars.
  internals: 'Internals',
  // Real product (79 pages, scaffolded) but developer.hashicorp.com/terraform's own
  // left sidebar does not list it as a 13th Documentation item (verified via the live
  // site's DOM: only 12 links appear there) -- it's only surfaced from the
  // Documentation hub page's own cross-link list. Reachable at /cdktf and linked from
  // the doc hub (see DocHub), kept out of the main sidebar to match the verified 12.
  cdktf: {
    display: 'hidden'
  }
}
