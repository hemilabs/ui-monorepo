import localFont from 'next/font/local'

export const interDisplay = localFont({
  src: [
    {
      path: './inter/display/InterDisplay-Regular.woff2',
      style: 'normal',
      weight: '400',
    },
    {
      path: './inter/display/InterDisplay-Medium.woff2',
      style: 'normal',
      weight: '500',
    },
    {
      path: './inter/display/InterDisplay-SemiBold.woff2',
      style: 'normal',
      weight: '600',
    },
  ],
  variable: '--font-inter-display',
})

export const interVariable = localFont({
  src: [
    {
      path: './inter/variable/InterVariable.woff2',
      style: 'normal',
      weight: '100 900',
    },
  ],
  variable: '--font-inter-variable',
})
