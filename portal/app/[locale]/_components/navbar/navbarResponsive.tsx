'use client'

import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import { screenBreakpoints } from 'styles'

import { NavbarDesktop } from './navbarDesktop'
import { NavbarMobile } from './navbarMobile'

/** Contenido del menú; el `<Drawer>` vive en `AppLayout` para evitar doble animación con `dynamic`+`DrawerLoader`. */
export const NavbarResponsive = function () {
  const { width } = useWindowSize()
  if (width >= screenBreakpoints.xl) {
    // as of lg breakpoint in tailwind, it should not render anything
    // Can't use CSS because the drawer works as a Portal in React.
    return null
  }
  return width >= screenBreakpoints.md ? <NavbarDesktop /> : <NavbarMobile />
}
