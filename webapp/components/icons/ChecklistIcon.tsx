'use client'

import { iconFactory } from './iconFactory'

const paths = [
  {
    d: 'M9.75 12.5H15M9.75 6.5H15M3 7.25L4.125 8L6.375 5M3 13.25L4.125 14L6.375 11',
    fill: false,
    stroke: true,
  },
]

export const ChecklistIcon = iconFactory(paths, 'CHECKLIST')
