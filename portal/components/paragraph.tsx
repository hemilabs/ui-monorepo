import { type ReactNode } from 'react'
const variants = {
  /* eslint-disable sort-keys */
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  /* eslint-enable sort-keys */
} as const

type Props = {
  children: ReactNode
  className?: string
  variant?: keyof typeof variants
}

export const P = ({ children, className = '', variant = 'normal' }: Props) => (
  <p className={`text-sm ${variants[variant]} ${className}`}>{children}</p>
)
