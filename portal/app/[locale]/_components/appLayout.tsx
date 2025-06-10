'use client'

import { useNetworkType } from 'hooks/useNetworkType'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import React, { useEffect, useState } from 'react'

import { Header } from './header'
import { Navbar } from './navbar'

type Props = {
  children: React.ReactNode
}

const TestnetIndicator = function () {
  const [networkType] = useNetworkType()
  if (networkType !== 'testnet') {
    return null
  }

  return (
    <span
      className="absolute left-1/2 z-10 -translate-x-1/2 rounded-b bg-orange-500
    px-2 text-sm font-medium text-white"
    >
      Testnet
    </span>
  )
}

const Backdrop = ({ onClick }) => (
  <div
    className="absolute left-0 top-0 z-20
    h-screen w-screen bg-gradient-to-b
    from-neutral-950/0 to-neutral-950/25"
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

  // Footer is only visible if at least one chain is connected
  const showFooter = !allDisconnected
  return (
    <div
      className={`
        shadow-hemi-layout backdrop-blur-20 relative flex h-full
        w-3/4 flex-1 flex-col self-stretch overflow-y-hidden bg-neutral-50 lg:h-[calc(100dvh-16px)]
        ${
          networkType === 'testnet'
            ? 'md:border-2 md:border-orange-500'
            : 'border-neutral-300/55 lg:border'
        }
        md:my-0 md:mr-0 md:w-[calc(75%-8px)] lg:my-2 lg:mr-2 lg:rounded-2xl`}
      id="app-layout-container"
    >
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
            className="shadow-navbar z-30 ml-2 mt-2 hidden rounded-xl bg-white p-1 md:absolute md:block lg:hidden"
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
    </div>
  )
}
