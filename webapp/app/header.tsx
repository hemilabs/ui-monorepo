'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const WalletConnectButton = dynamic(() =>
  import('components/wallet-integration/walletConnectButton').then(
    mod => mod.WalletConnectButton,
  ),
)

type Props = {
  path: '/bridge' | '/swap'
  text: string
}

const Route = function ({ path, text }: Props) {
  const pathname = usePathname()
  const activeLink = 'bg-white text-black cursor-auto'
  const inactiveLink = 'bg-transparent cursor-pointer text-zinc-500'
  return (
    <li
      className={`rounded-2xl px-5 py-3 ${
        pathname === path ? activeLink : inactiveLink
      }`}
    >
      <Link href={path}>{text}</Link>
    </li>
  )
}

export const Header = () => (
  <header className="py-6">
    <nav>
      <ul className="flex w-full justify-center gap-x-4">
        <Route path="/bridge" text="Bridge" />
        <Route path="/swap" text="Swap" />
      </ul>
    </nav>
    <div className="absolute right-4 top-6 pr-4">
      <WalletConnectButton />
    </div>
  </header>
)
