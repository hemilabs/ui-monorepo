'use client'

import { navbarIconFactory } from './NavbarIconFactory'

const paths = [
  {
    d: 'M15.75 9C15.75 12.728 12.7279 15.75 8.99998 15.75C5.27208 15.75 2.25 12.728 2.25 9C2.25 5.27208 5.27208 2.25 8.99998 2.25C12.7279 2.25 15.75 5.27208 15.75 9Z',
    stroke: true,
  },
  {
    d: 'M11.1215 6.87891L7.50022 7.50023L6.87891 11.1215L10.5002 10.5002L11.1215 6.87891Z',
    stroke: true,
  },
]

export const ExplorerIcon = navbarIconFactory(paths, 'EXPLORER')
