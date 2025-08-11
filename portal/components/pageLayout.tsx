import { ReactNode } from 'react'

/* eslint-disable sort-keys */
const variants = {
  center: 'max-w-5xl px-4',
  wide: 'xl:px-12 xl:pb-12 px-4',
  superWide: 'px-2 md:px-4 xl:px-6 xl:pb-6',
} as const
/* eslint-enable sort-keys */

type Props = {
  children: ReactNode
  variant: keyof typeof variants
}

export const PageLayout = ({ children, variant }: Props) => (
  <div className={`mx-auto ${variants[variant]}`}>{children}</div>
)
