import { locales } from 'app/i18n'
import type { Metadata } from 'next'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export const metadata: Metadata = {
  title: 'hemi',
}

export const generateStaticParams = async () =>
  locales.map(locale => ({ locale }))

// Since we have a `not-found.tsx` page on the root, a layout file
// is required, even if it's just passing children through.
export default function RootLayout({ children }: Props) {
  // Define empty body because otherwise it will break client redirects
  // See https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
