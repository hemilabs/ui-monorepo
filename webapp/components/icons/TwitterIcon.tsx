'use client'

import { iconFactory } from './iconFactory'

const paths = [
  {
    d: `M 2.605469 2.640625 L 9.054688 12.046875 L 2.742188 19.359375 L 4.140625 19.359375 L 9.675781
     12.945312 L 14.074219 19.359375 L 19.359375 19.359375 L 12.621094 9.535156 L 18.566406 2.640625 L 
     17.171875 2.640625 L 12 8.632812 L 7.890625 2.640625 Z M 4.277344 3.519531 L 7.425781 3.519531 L 
     17.6875 18.480469 L 14.539062 18.480469 Z M 4.277344 3.519531`,
    fill: true,
    stroke: false,
  },
]

export const TwitterIcon = iconFactory(paths, 'TWITTER')
