'use client'

import { navItems } from 'app/[locale]/navbar/navData'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next-intl/link'
import { useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { HamburgerIcon } from 'ui-common/components/hamburgerIcon'
import { HemiSymbol } from 'ui-common/components/hemiLogo'
import { useOnClickOutside } from 'ui-common/hooks/useOnClickOutside'

import { NavbarMobile } from './navbarMobile'

const WalletConnectButton = dynamic(
  () =>
    import('components/walletConnectButton').then(
      mod => mod.WalletConnectButton,
    ),
  {
    loading: () => <Skeleton className="mr-8 h-10 w-28" />,
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
  path: '/swap' | '/tunnel'
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
  const t = useTranslations('common')

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const menuRef = useOnClickOutside<HTMLDivElement>(toggleMenu)

  return (
    <header className="h-19 relative flex items-center justify-end pb-3">
      <div className="hidden md:flex">
        <WalletConnectButton />
      </div>

      <div className="ml-4 h-8 w-8 md:hidden">
        <Link href="/tunnel">
          <HemiSymbol />
        </Link>
      </div>
      {/* Hidden below until links are re-enabled */}
      {/* <div className="fixed bottom-0 left-0 right-0 z-10 h-[90px] bg-white/60 backdrop-blur-sm md:hidden" /> */}
      <div className="hidden">
        <div className="fixed bottom-0 z-10 flex w-full pb-6 pt-4 md:absolute md:left-1/2 md:block md:-translate-x-1/2">
          <ul className="mx-auto hidden justify-center gap-x-4 rounded-xl bg-neutral-100 p-1 md:mx-0 md:bg-inherit">
            <Route path="/tunnel" text={t('tunnel')} />
            <Route path="/swap" text={t('swap')} />
          </ul>
        </div>
      </div>
      {/* Hidden above until links are re-enabled */}
      {/* <WalletConnectButton /> */}

      <button
        className="ml-auto mr-4 cursor-pointer md:hidden"
        onClick={toggleMenu}
        type="button"
      >
        <HamburgerIcon />
      </button>
      {isMenuOpen && (
        <>
          <div className="fixed bottom-0 left-px top-0 z-20 w-full rounded-3xl bg-neutral-200/30 backdrop-blur-sm"></div>
          <div
            className="fixed bottom-0 left-0 right-0 z-20 flex items-center shadow-2xl md:hidden"
            ref={menuRef}
          >
            <div className="mb-3 flex w-full flex-col justify-between rounded-xl bg-white px-5 py-1">
              <WalletConnectMobile />
              <div className="flex flex-col">
                <NavbarMobile
                  navItems={navItems}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
