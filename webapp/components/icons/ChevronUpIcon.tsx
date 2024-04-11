'use client'

import { navbarIconFactory } from './NavbarIconFactory'

const paths = [
  {
    d: 'M13 11.25L9 7.25L5 11.25',
    fill: false,
    stroke: true,
  },
]

export const ChevronUpIcon = navbarIconFactory(paths, 'CHEVRONUP')
