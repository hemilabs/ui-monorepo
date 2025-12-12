'use client'

import { Drawer } from 'components/drawer'
import { useWindowSize } from 'hooks/useWindowSize'
import { screenBreakpoints } from 'styles'

import { NavbarDesktop } from './navbarDesktop'
import { NavbarMobile } from './navbarMobile'

type Props = {
  onClose: VoidFunction
}

// The tablet navbar is the desktop one contained in a Drawer
export const NavbarResponsive = function ({ onClose }: Props) {
  const { width } = useWindowSize()
  if (width >= screenBreakpoints.lg) {
    // as of lg breakpoint in tailwind, it should not render anything
    // Can't use CSS because the drawer works as a Portal in React.
    return null
  }
  if (width >= screenBreakpoints.md) {
    // tablet mode
    return (
      <Drawer onClose={onClose} position="left">
        <NavbarDesktop />
      </Drawer>
    )
  }
  // mobile mode
  return <NavbarMobile />
}
