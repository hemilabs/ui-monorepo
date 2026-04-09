'use client'

import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import { screenBreakpoints } from 'styles'

import { NavbarDesktop } from './navbarDesktop'
import { NavbarMobile } from './navbarMobile'

export const NavbarResponsive = function () {
  const { width } = useWindowSize()
  if (width >= screenBreakpoints.xl) {
    return null
  }
  return width >= screenBreakpoints.md ? <NavbarDesktop /> : <NavbarMobile />
}
