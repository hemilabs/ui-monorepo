'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import Link from 'next-intl/link'
import { useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { HamburgerIcon } from 'ui-common/components/HamburguerIcon'
import { useOnClickOutside } from 'ui-common/hooks/useOnClickOutside'

const WalletConnectButton = dynamic(
  () =>
    import('components/walletConnectButton').then(
      mod => mod.WalletConnectButton,
    ),
  {
    loading: () => <Skeleton className="h-10 w-28" />,
    ssr: false,
  },
)

const WalletConnectMobile = dynamic(
  () =>
    import('components/walletConnectButton').then(
      mod => mod.WalletConnectMobile,
    ),
  {
    loading: () => <Skeleton className="h-10 w-28" />,
    ssr: false,
  },
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

export const Header = function () {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const menuRef = useOnClickOutside<HTMLDivElement>(toggleMenu)

  return (
    <header className="relative flex h-24 items-center py-6">
      <div className="fixed bottom-0 left-0 right-0 z-10 h-[90px] bg-white/60 backdrop-blur-sm md:hidden" />
      <div className="fixed bottom-0 z-10 flex w-full pb-6 pt-4 md:absolute md:left-1/2 md:block md:-translate-x-1/2">
        <ul className="mx-auto flex justify-center gap-x-4 rounded-xl bg-neutral-100 p-[2px] md:mx-0 md:bg-inherit">
          <Route path="/bridge" text="Bridge" />
          <Route path="/swap" text="Swap" />
        </ul>
      </div>
      <WalletConnectButton />
      <button
        className="ml-auto mr-4 cursor-pointer md:hidden"
        onClick={toggleMenu}
        type="button"
      >
        <HamburgerIcon />
      </button>
      {isMenuOpen && (
        <>
          <div className="fixed bottom-0 top-0 z-20 w-full bg-neutral-200/30 backdrop-blur-sm"></div>
          <div
            className="fixed bottom-0 left-0 right-0 z-20 flex items-center shadow-2xl md:hidden"
            ref={menuRef}
          >
            <WalletConnectMobile />
          </div>
        </>
      )}
    </header>
  )
}
