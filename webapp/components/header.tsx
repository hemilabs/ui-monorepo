'use client'

import { navItems } from 'app/[locale]/navbar/navData'
import dynamic from 'next/dynamic'
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

export const Header = function () {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
