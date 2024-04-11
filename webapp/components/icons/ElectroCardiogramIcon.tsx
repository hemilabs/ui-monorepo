'use client'

import { navbarIconFactory } from './NavbarIconFactory'

const paths = [
  {
    d: 'M1.5 9.5H4.5L6.75 3.5L11.25 15.5L13.5 9.5H16.5',
    fill: false,
    stroke: true,
  },
]

export const ElectroCardiogramIcon = navbarIconFactory(
  paths,
  'ELECTRO_CARDIOGRAM',
)
