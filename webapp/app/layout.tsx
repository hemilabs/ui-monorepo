import 'styles/globals.css'

import { WalletContext } from 'components/wallet-integration/walletContext'
import type { Metadata } from 'next'

import { inter, rightGrotesk } from './fonts'
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
      <body
        className={`flex h-screen flex-col bg-neutral-100 ${rightGrotesk.variable} ${inter.className}`}
      >
        <WalletContext>
          <Header />
          {children}
        </WalletContext>
      </body>
    </html>
  )
}
