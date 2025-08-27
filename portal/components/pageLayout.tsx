import { ReactNode } from 'react'

/* eslint-disable sort-keys */
const variants = {
  center: 'mx-auto max-w-5xl px-4',
  genesisDrop: 'px-2 md:px-4 xl:px-0 xl:pb-6 2xl:px-6',
  wide: 'mx-auto xl:px-12 xl:pb-12 px-4',
  superWide: 'mx-auto px-2 md:px-4 xl:px-6 xl:pb-6',
} as const
/* eslint-enable sort-keys */

type Props = {
  children: ReactNode
  variant: keyof typeof variants
}

export const PageLayout = ({ children, variant }: Props) => (
  <div className={variants[variant]}>{children}</div>
)
