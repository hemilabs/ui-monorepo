import { ReactNode } from 'react'

/* eslint-disable sort-keys */
const variants = {
  center: 'max-w-5xl px-4',
  wide: 'lg:px-12 lg:pb-12 px-4',
} as const
/* eslint-enable sort-keys */

type Props = {
  children: ReactNode
  variant: keyof typeof variants
}

export const PageLayout = ({ children, variant }: Props) => (
  <div className={`mx-auto ${variants[variant]}`}>{children}</div>
)
