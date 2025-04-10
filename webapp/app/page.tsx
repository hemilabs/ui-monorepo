import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  description:
    'Hemi | Powered by Bitcoin and Ethereum — Bridge, swap, build, and more. All on Hemi.',
  openGraph: {
    description:
      'Hemi | Powered by Bitcoin and Ethereum — Bridge, swap, build, and more. All on Hemi.',
    images: [
      {
        url: 'https://hemi.xyz/image/portal.png',
      },
    ],
    title: 'Hemi Portal',
    type: 'website',
  },
  title: 'Hemi Portal',
  twitter: {
    card: 'summary_large_image',
    description:
      'Hemi | Powered by Bitcoin and Ethereum — Bridge, swap, build, and more. All on Hemi.',
    images: ['https://hemi.xyz/image/portal.png'],
    title: 'Hemi Portal',
  },
}

export default function RootPage() {
  redirect('/tunnel')
}
