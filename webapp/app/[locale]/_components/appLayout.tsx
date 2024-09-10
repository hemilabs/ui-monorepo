'use client'

import { useAccounts } from 'hooks/useAccounts'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { Footer } from './footer'
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
      className="text-ms absolute left-1/2 -translate-x-1/2 rounded-b 
    bg-orange-500 px-2 font-medium leading-5 text-white"
    >
      Testnet
    </span>
  )
}

export const AppLayout = function ({ children }: Props) {
  const { allDisconnected } = useAccounts()
  const [networkType] = useNetworkType()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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
      className={`shadow-hemi-layout backdrop-blur-20 lg:h-97vh flex
        h-full w-3/4 flex-1 flex-col self-stretch overflow-y-hidden bg-neutral-50 md:border-solid
    ${
      networkType === 'testnet'
        ? 'md:border-2 md:border-orange-500'
        : 'md:border'
    }
    md:my-3 md:mr-2 md:w-[calc(75%-8px)] md:rounded-2xl md:pb-0`}
    >
      <div className="relative hidden md:block">
        <TestnetIndicator />
      </div>
      <Header isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <div
        className={`box-border ${
          // 7rem comes from header (3.5) + footer (3.5) heights
          showFooter
            ? 'max-h-[calc(100dvh-7rem)]'
            : 'max-h-[calc(100dvh-3.5rem)]'
        }
          flex-grow md:max-h-[calc(100dvh-1rem)]
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
        <div className="h-full overflow-y-auto px-5 pb-3 pt-4">{children}</div>
      </div>

      {isMenuOpen ? (
        <div className="md:hidden">
          <Navbar />
        </div>
      ) : (
        showFooter && <Footer />
      )}
    </div>
  )
}
