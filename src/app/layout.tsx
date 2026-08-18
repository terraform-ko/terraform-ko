import type { Metadata } from 'next'
import { Footer, Layout } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { TopNav } from '../components/top-nav'
import 'nextra-theme-docs/style.css'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s - terraform-ko',
    default: 'terraform-ko'
  },
  description: 'Terraform 공식 문서 한국어 번역 프로젝트'
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const pageMap = await getPageMap()
  return (
    <html lang="ko" dir="ltr" suppressHydrationWarning>
      <Head color={{ hue: 271, saturation: 48 }} />
      <body>
        <Layout
          navbar={<TopNav />}
          footer={<Footer>MIT {new Date().getFullYear()} © terraform-ko contributors.</Footer>}
          editLink="GitHub에서 이 페이지 수정하기"
          docsRepositoryBase="https://github.com/terraform-ko/terraform-ko/blob/main"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          nextThemes={{ defaultTheme: 'dark' }}
          pageMap={pageMap}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
