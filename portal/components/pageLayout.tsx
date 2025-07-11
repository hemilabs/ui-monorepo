import { ReactNode } from 'react'

const variants = {
  center: 'max-w-5xl',
  wide: 'xl:px-12 xl:pb-12',
} as const

type Props = {
  children: ReactNode
  variant: keyof typeof variants
}

export const PageLayout = ({ children, variant }: Props) => (
  <div className={`mx-auto px-4 ${variants[variant]}`}>{children}</div>
)
