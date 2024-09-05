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
      className={`bg-hemi-layout bg-hemi-color-layout shadow-hemi-layout backdrop-blur-20 lg:100-dvh lg:h-97vh
    flex w-3/4 flex-1 flex-col self-stretch overflow-y-hidden border-slate-100
    md:my-3 md:mr-2 md:w-[calc(75%-8px)] md:rounded-3xl md:border md:pb-0`}
    >
      <Header isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <div
        className={`max-h-[calc(100vh-1rem)] flex-grow overflow-y-auto px-5 pt-4 ${hiddenClass} pb-3`}
      >
        {children}
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <Navbar />
        </div>
      )}
    </div>
  )
}
