'use client'

import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import { Drawer } from 'components/drawer'
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
import { NavbarResponsive } from './navbar/navbarResponsive'
import { NavBarUrlSync } from './navbar/navBarUrlSync'
import { TestnetIndicator } from './testnetIndicator'

type Props = {
  children: ReactNode
}

export const AppLayout = function ({ children }: Props) {
  const [isNavbarOpen, setIsNavbarOpen] = useState(false)
  const { width } = useWindowSize()

  const toggleMenu = () => setIsNavbarOpen(!isNavbarOpen)

  const closeNavbar = useCallback(function closeNavbar() {
    setIsNavbarOpen(false)
  }, [])

  useEffect(
    function closeNavbarWhenDesktopLayout() {
      if (width != null && width >= screenBreakpoints.xl) {
        setIsNavbarOpen(false)
      }
    },
    [width],
  )

  const showNavbarDrawer =
    isNavbarOpen && (width == null || width < screenBreakpoints.xl)

  return (
    <AppLayoutContainer>
      <Suspense>
        <NavBarUrlSync setIsNavbarOpen={setIsNavbarOpen} />
      </Suspense>
      <div className="relative hidden md:block">
        <TestnetIndicator />
      </div>
      <Header
        isMenuOpen={isNavbarOpen}
        setIsNavbarOpen={setIsNavbarOpen}
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
    </AppLayoutContainer>
  )
}
