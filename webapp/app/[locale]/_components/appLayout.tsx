'use client'

import React, { useState } from 'react'

import { Footer } from './footer'
import { Header } from './header'
import { Navbar } from './navbar'
import { NavItemData } from './navbar/_components/navItems'

type Props = {
  children: React.ReactNode
}

export const AppLayout = function ({ children }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // Hide instead of not-rendering when the header is open, to avoid loosing state of the components when opening
  // and closing the header
  const hiddenClass = isMenuOpen ? 'hidden' : ''

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const onNavBarMenuItemClick = function (item?: NavItemData) {
    // close the nav bar menu... unless we clicked an item with submenus
    if (!item?.subMenus) {
      toggleMenu()
    }
  }
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
      <div className={`-mb-px mt-auto hidden pt-3 md:block ${hiddenClass}`}>
        <Footer />
      </div>
      {isMenuOpen && (
        <div className="md:hidden [&>*]:px-3">
          <Navbar onItemClick={onNavBarMenuItemClick} />
        </div>
      )}
    </div>
  )
}
