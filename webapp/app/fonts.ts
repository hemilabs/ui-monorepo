import { Inter } from 'next/font/google'
import localFont from 'next/font/local'

// eslint-disable-next-line new-cap
export const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

// Check with https://fontdrop.info if needed
export const rightGrotesk = localFont({
  src: [
    {
      path: '../styles/fonts/RightGrotesk-fw-500.otf',
    },
    {
      path: '../styles/fonts/RightGrotesk-fw-500-2.otf',
    },
    {
      path: '../styles/fonts/RightGrotesk-fw-500-3.otf',
    },
  ],
  variable: '--font-right-grotesk',
  weight: '500',
})
