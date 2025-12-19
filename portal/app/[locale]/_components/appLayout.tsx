'use client'

import { DrawerLoader } from 'components/drawer/drawerLoader'
import dynamic from 'next/dynamic'
import React, { Suspense, useState, ReactNode } from 'react'

import { AppLayoutContainer } from './appLayoutContainer'
import { Header } from './header'
import { MainContainer } from './mainContainer'
import { NavBarUrlSync } from './navbar/navBarUrlSync'
import { TestnetIndicator } from './testnetIndicator'

const NavbarResponsive = dynamic(
  () => import('./navbar/navbarResponsive').then(mod => mod.NavbarResponsive),
  {
    loading: () => (
      <DrawerLoader
        className="h-90dvh md:w-54 w-full md:h-full"
        position="left"
      />
    ),
    ssr: false,
  },
)

type Props = {
  children: ReactNode
}

export const AppLayout = function ({ children }: Props) {
  const [isNavbarOpen, setIsNavbarOpen] = useState(false)

  const toggleMenu = () => setIsNavbarOpen(!isNavbarOpen)

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
      {isNavbarOpen && (
        <NavbarResponsive onClose={() => setIsNavbarOpen(false)} />
      )}
    </AppLayoutContainer>
  )
}
