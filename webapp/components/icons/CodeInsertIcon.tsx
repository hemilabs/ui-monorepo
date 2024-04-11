'use client'

import { navbarIconFactory } from './NavbarIconFactory'

const paths = [
  {
    d: `M9 4.25H3C2.58579 4.25 2.25 4.58579 2.25 5V14C2.25 14.4142 2.58579 14.75 3 14.75H9M12 4.25H15C15.4142 4.25 
  15.75 4.58579 15.75 5V14C15.75 14.4142 15.4142 14.75 15 14.75H12M12 4.25V2.375M12 4.25V14.75M12 14.75V16.625M6 
  7.625L7.875 9.5L6 11.375`,
    fill: false,
    stroke: true,
  },
]

export const CodeInsertIcon = navbarIconFactory(paths, 'CODE_INSERT')
