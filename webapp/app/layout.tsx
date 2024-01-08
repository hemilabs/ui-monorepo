import type { Metadata } from 'next'
import 'styles/globals.css'

import { Header } from './header'

export const metadata: Metadata = {
  title: 'BVM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex h-screen flex-col bg-neutral-100">
        <Header />
        {children}
      </body>
    </html>
  )
}
