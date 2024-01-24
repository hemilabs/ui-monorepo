import { Inter } from 'next/font/google'
import localFont from 'next/font/local'

// eslint-disable-next-line new-cap
export const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

// Check with https://fontdrop.info if needed
export const bricolageGrotesque = localFont({
  src: [
    {
      path: '../styles/fonts/BricolageGrotesque_24pt-Bold.ttf',
    },
  ],
  variable: '--font-bricolage-grotesque',
  weight: '400',
})
