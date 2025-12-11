'use client'

import { DrawerLoader } from 'components/drawer/drawerLoader'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import dynamic from 'next/dynamic'
import React, {
  Dispatch,
  SetStateAction,
  Suspense,
  useEffect,
  useState,
} from 'react'

import { AppLayoutContainer } from './appLayoutContainer'
import { Header } from './header'
import { MainContainer } from './mainContainer'
import { NavbarMobile } from './navbar/navbarMobile'
import { TestnetIndicator } from './testnetIndicator'

const NavbarTablet = dynamic(
  () => import('./navbar/navbarTablet').then(mod => mod.NavbarTablet),
  {
    loading: () => <DrawerLoader className="w-54 h-full" position="left" />,
    ssr: false,
  },
)

type Props = {
  children: React.ReactNode
}

// UI-less component so I can wrap it on suspense.
// Hooks can't be wrapped...
const NavBarUrlSync = function ({
  setIsMenuOpen,
}: {
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>
}) {
  const [networkType] = useNetworkType()
  const pathname = usePathnameWithoutLocale()

  useEffect(
    function closeNavBarOnUrlChange() {
      setIsMenuOpen(false)
    },
    [networkType, pathname, setIsMenuOpen],
  )

  return null
}

export const AppLayout = function ({ children }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNavbarOpen, setIsNavbarOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <AppLayoutContainer>
      <Suspense>
        <NavBarUrlSync setIsMenuOpen={setIsMenuOpen} />
      </Suspense>
      <div className="relative hidden md:block">
        <TestnetIndicator />
      </div>
      <Header
        isMenuOpen={isMenuOpen}
        setIsNavbarOpen={setIsNavbarOpen}
        toggleMenu={toggleMenu}
      />
      <MainContainer hide={isMenuOpen}>
        <div className="relative md:hidden">
          <TestnetIndicator />
        </div>
        <div className="h-full overflow-y-auto">
          <div className="relative h-full overflow-x-hidden pb-3 pt-4 md:pt-12">
            {children}
          </div>
        </div>
      </MainContainer>
      {isNavbarOpen && <NavbarTablet onClose={() => setIsNavbarOpen(false)} />}
      {isMenuOpen ? (
        <div className="md:hidden">
          <NavbarMobile />
        </div>
      ) : null}
    </AppLayoutContainer>
  )
}
