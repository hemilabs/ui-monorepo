'use client'

import { navbarIconFactory } from './NavbarIconFactory'

const paths = [
  {
    d: 'M15 16.0256H3V9.63424C3 0.582022 15 0.490095 15 9.63424V16.0256Z',
    stroke: true,
  },
  {
    d: 'M11.9042 16.0255H6.0957V9.93183C6.0957 5.55021 11.9042 5.50571 11.9042 9.93183V16.0255Z',
    fill: true,
    stroke: true,
  },
]

export const TunnelIcon = navbarIconFactory(paths, 'TUNNEL')
