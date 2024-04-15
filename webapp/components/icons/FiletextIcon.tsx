'use client'

import { iconFactory } from './iconFactory'

const paths = [
  {
    d: `M9.75 2.75H4.5C4.08579 2.75 3.75 3.08579 3.75 3.5V15.5C3.75 15.9142 4.08579 16.25 4.5 16.25H13.5C13.9142
   16.25 14.25 15.9142 14.25 15.5V7.25M9.75 2.75L14.25 7.25M9.75 2.75V6.5C9.75
    6.91421 10.0858 7.25 10.5 7.25H14.25M6.75 10.25H9M6.75 13.25H11.625`,
    fill: false,
    stroke: true,
  },
]

export const FiletextIcon = iconFactory(paths, 'FILETEXT')
