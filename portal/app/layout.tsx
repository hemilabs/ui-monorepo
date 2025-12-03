import { locales } from 'i18n/routing'
import { Metadata } from 'next'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

const previewImage =
  'https://framerusercontent.com/assets/k63TVkxaxEkDMdo7zqWW0Xpo.png'

export const metadata: Metadata = {
  description:
    'Hemi | Powered by Bitcoin and Ethereum — Bridge, swap, build, and more. All on Hemi.',
  openGraph: {
    description:
      'Hemi | Powered by Bitcoin and Ethereum — Bridge, swap, build, and more. All on Hemi.',
    images: [
      {
        url: previewImage,
      },
    ],
    type: 'website',
  },
  title: 'Hemi Portal',
  twitter: {
    card: 'summary_large_image',
    description:
      'Hemi | Powered by Bitcoin and Ethereum — Bridge, swap, build, and more. All on Hemi.',
    images: [previewImage],
  },
}

export const generateStaticParams = async () =>
  locales.map(locale => ({ locale }))

// Since we have a `not-found.tsx` page on the root, a layout file
// is required, even if it's just passing children through.
// However, it does throw a warning when running locally
// See https://github.com/amannn/next-intl/issues/1385
// it works on production
export default function RootLayout({ children }: Props) {
  return children
}
