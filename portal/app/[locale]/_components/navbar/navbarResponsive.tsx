'use client'

import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import { screenBreakpoints } from 'styles'

import { NavbarDesktop } from './navbarDesktop'
import { NavbarMobile } from './navbarMobile'

export const NavbarResponsive = function () {
  const { width } = useWindowSize()
  if (width >= screenBreakpoints.xl) {
    // as of xl breakpoint in tailwind, it should not render anything
    return null
  }
  return width >= screenBreakpoints.md ? <NavbarDesktop /> : <NavbarMobile />
}
