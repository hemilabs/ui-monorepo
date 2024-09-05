'use client'

import { useNetworkType } from 'hooks/useNetworkType'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { Header } from './header'
import { Navbar } from './navbar'

type Props = {
  children: React.ReactNode
}

export const AppLayout = function ({ children }: Props) {
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

  return (
    <div
      className={`shadow-hemi-layout backdrop-blur-20 lg:100-dvh
        lg:h-97vh flex w-3/4 flex-1 flex-col self-stretch overflow-y-hidden bg-neutral-50
    ${
      networkType === 'testnet'
        ? 'md:border-2 md:border-solid md:border-orange-500'
        : 'md:border'
    }
    md:my-3 md:mr-2 md:w-[calc(75%-8px)] md:rounded-2xl md:pb-0`}
    >
      <Header isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <div
        className={`max-h-[calc(100vh-1rem)] flex-grow
          ${
            networkType === 'testnet'
              ? 'max-md:border-3  max-md:border-solid max-md:border-orange-500'
              : ''
          }
        overflow-y-auto px-5 pt-4
        ${hiddenClass} pb-3`}
      >
        {children}
      </div>
      <div className="h-14 md:hidden">
        {/* See https://github.com/hemilabs/ui-monorepo/issues/502 */}
        <footer>Footer</footer>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <Navbar />
        </div>
      )}
    </div>
  )
}
