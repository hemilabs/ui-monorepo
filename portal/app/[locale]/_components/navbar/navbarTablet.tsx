'use client'

import { Drawer } from 'components/drawer'
import { useWindowSize } from 'hooks/useWindowSize'

import { NavbarDesktop } from './navbarDesktop'

type Props = {
  onClose: VoidFunction
}

// The tablet navbar is the desktop one contained in a Drawer
export const NavbarTablet = function ({ onClose }: Props) {
  const { width } = useWindowSize()
  if (width >= 1024) {
    // as of lg breakpoint in tailwind, it should not render anything
    // Can't use CSS because the drawer works as a Portal in React.
    return null
  }
  return (
    <Drawer onClose={onClose} position="left">
      <NavbarDesktop />
    </Drawer>
  )
}
