import nextra from 'nextra'

const withNextra = nextra({})

export default withNextra({
  reactStrictMode: true,
  devIndicators: false,
  async redirects() {
    return [
      // Nextra's sidebar merges a meta `href` alias with the real pageMap node
      // whenever the href matches ANY existing route already in the pageMap -- leaf
      // page or folder, doesn't matter -- and the alias silently stops navigating
      // (verified in Chrome with a plain JS click: URL never changed). The official
      // sidebar lists a good number of pages under more than one group (e.g.
      // "provider block reference" appears both under "Configuration blocks" and
      // under "Configure providers"); every one of those second listings needs a
      // route with NO matching pageMap entry to route through. "/_ref/*" is reserved
      // for exactly that -- it always redirects straight through to the real page,
      // so a second sidebar listing can point at "/_ref/language/block/provider" and
      // land on the one real "/language/block/provider" page.
      {
        source: '/provider-use',
        destination: '/language/providers',
        permanent: false
      },
      {
        source: '/_ref/:path*',
        destination: '/:path*',
        permanent: false
      }
    ]
  }
})
