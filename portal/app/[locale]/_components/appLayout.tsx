'use client'

import { useNetworkType } from 'hooks/useNetworkType'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import React, { useEffect, useState } from 'react'

import { AppLayoutContainer } from './appLayoutContainer'
import { Header } from './header'
import { Navbar } from './navbar'
import { TestnetIndicator } from './testnetIndicator'

type Props = {
  children: React.ReactNode
}

const Backdrop = ({ onClick }) => (
  <div
    className="absolute left-0 top-0 z-20
    h-screen w-screen bg-gradient-to-b
    from-neutral-950/0 to-neutral-950/25
    lg:hidden"
    onClick={onClick}
  />
)

export const AppLayout = function ({ children }: Props) {
  const [networkType] = useNetworkType()
  const pathname = usePathnameWithoutLocale()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNavbarOpen, setIsNavbarOpen] = useState(false)
  const ref = useOnClickOutside<HTMLDivElement>(() => setIsNavbarOpen(false))

  // Hide instead of not-rendering when the header is open, to avoid loosing state of the components when opening
  // and closing the header
  const hiddenClass = isMenuOpen ? 'hidden' : ''

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  useEffect(
    function closeNavBarOnUrlChange() {
      setIsMenuOpen(false)
    },
    [networkType, pathname, setIsMenuOpen],
  )

  return (
    <AppLayoutContainer>
      <div className="relative hidden md:block">
        <TestnetIndicator />
      </div>
      <Header
        isMenuOpen={isMenuOpen}
        setIsNavbarOpen={setIsNavbarOpen}
        toggleMenu={toggleMenu}
      />
      <div
        className={`box-border h-[calc(100dvh-3.5rem)] flex-grow
          md:h-[calc(100dvh-4.25rem-1rem)]
          ${hiddenClass}
          ${
            networkType === 'testnet'
              ? 'max-md:border-3 max-md:border-solid max-md:border-orange-500'
              : ''
          }`}
      >
        <div className="relative md:hidden">
          <TestnetIndicator />
        </div>
        <div className="h-full overflow-y-auto">
          <div
            className={`relative mx-auto h-full px-4 pb-3 pt-4 md:pt-12
            ${
              // transaction history, and stake pages page use a different layout
              pathname.endsWith('transaction-history/') ||
              pathname.startsWith('/stake')
                ? 'xl:px-12 xl:pb-12'
                : 'max-w-5xl'
            }`}
          >
            {children}
          </div>
        </div>
      </div>
      {isNavbarOpen && (
        <>
          <Backdrop onClick={() => setIsNavbarOpen(false)} />
          <div
            className="shadow-navbar z-30 ml-2 mt-2 hidden  h-[calc(100dvh-16px)] rounded-xl bg-white p-1 md:absolute md:block lg:hidden"
            ref={ref}
          >
            <Navbar />
          </div>
        </>
      )}
      {isMenuOpen ? (
        <div className="md:hidden">
          <Navbar />
        </div>
      ) : null}
    </AppLayoutContainer>
  )
}
