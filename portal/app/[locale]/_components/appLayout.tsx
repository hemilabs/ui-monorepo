'use client'

import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import { ConnectWalletsDrawer } from 'components/connectWallets/connectWalletsDrawer'
import { Drawer } from 'components/drawer'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useUmami } from 'hooks/useUmami'
import React, {
  Suspense,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { screenBreakpoints } from 'styles'

import { AppLayoutContainer } from './appLayoutContainer'
import { Header } from './header'
import { MainContainer } from './mainContainer'
import { MobileBottomBar } from './mobileBottomBar'
import { NavbarResponsive } from './navbar/navbarResponsive'
import { NavBarUrlSync } from './navbar/navBarUrlSync'
import { TestnetIndicator } from './testnetIndicator'

// Rendered only when the wallet drawer is open — never during static
// prerendering — so useUmami (useSearchParams) is safe here.
const WalletDrawer = function ({ closeDrawer }: { closeDrawer: VoidFunction }) {
  const { track } = useUmami()

  const onClose = useCallback(
    function onWalletDrawerClose() {
      track?.('close wallet drawer')
      closeDrawer()
    },
    [closeDrawer, track],
  )

  return (
    <Drawer onClose={onClose}>
      <ConnectWalletsDrawer closeDrawer={closeDrawer} />
    </Drawer>
  )
}

type Props = {
  children: ReactNode
}

export const AppLayout = function ({ children }: Props) {
  const [isNavbarOpen, setIsNavbarOpen] = useState(false)
  const [navbarDrawerMounted, setNavbarDrawerMounted] = useState(false)
  const { width } = useWindowSize()
  const { closeDrawer, isDrawerOpen } = useDrawerContext()

  const openNavbar = useCallback(function openNavbar() {
    setIsNavbarOpen(true)
    setNavbarDrawerMounted(true)
  }, [])

  // Only changes the button icon — the Drawer handles its own animated close
  // via useOnClickOutside, then calls closeNavbar after the transition.
  const closeMenu = useCallback(() => setIsNavbarOpen(false), [])

  const closeNavbar = useCallback(function closeNavbar() {
    setIsNavbarOpen(false)
    setNavbarDrawerMounted(false)
  }, [])

  const toggleMenu = useCallback(
    function toggleMenu() {
      if (isNavbarOpen) {
        setIsNavbarOpen(false)
      } else {
        openNavbar()
      }
    },
    [isNavbarOpen, openNavbar],
  )

  useEffect(
    function closeNavbarWhenDesktopLayout() {
      if (width != null && width >= screenBreakpoints.xl) {
        closeNavbar()
      }
    },
    [closeNavbar, width],
  )

  const showNavbarDrawer =
    navbarDrawerMounted && (width == null || width < screenBreakpoints.xl)

  return (
    <>
      <AppLayoutContainer>
        <Suspense>
          <NavBarUrlSync closeNavbar={closeNavbar} />
        </Suspense>
        <div className="relative hidden md:block">
          <TestnetIndicator />
        </div>
        <Header
          isMenuOpen={isNavbarOpen}
          openNavbar={openNavbar}
          toggleMenu={toggleMenu}
        />
        <MainContainer>
          <div className="relative md:hidden">
            <TestnetIndicator />
          </div>
          <div className="h-full overflow-y-auto">
            <div className="relative h-full overflow-x-hidden pb-3 pt-4 md:pt-12">
              {children}
            </div>
          </div>
        </MainContainer>
        {showNavbarDrawer && (
          <Drawer onClose={closeNavbar} position="left">
            <NavbarResponsive />
          </Drawer>
        )}
        {isDrawerOpen && <WalletDrawer closeDrawer={closeDrawer} />}
      </AppLayoutContainer>
      <MobileBottomBar
        closeMenu={closeMenu}
        isMenuOpen={isNavbarOpen}
        openMenu={openNavbar}
      />
    </>
  )
}
