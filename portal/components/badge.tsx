import { ComponentProps } from 'react'

const variants = {
  negative: 'bg-rose-50 text-rose-600',
  negativeB: 'bg-rose-600 text-rose-50',
  positive: 'bg-emerald-100 text-emerald-600',
  primary: 'bg-orange-100 text-orange-600',
  secondary: 'bg-neutral-50 text-neutral-600 shadow-bs',
} as const

type Props = Omit<ComponentProps<'span'>, 'className'> & {
  variant?: keyof typeof variants
}

export const Badge = ({ variant = 'primary', ...props }: Props) => (
  <span
    className={`body-text-caption inline-flex h-4 items-center justify-center overflow-hidden rounded-md px-1.5 ${variants[variant]}`}
    {...props}
  />
)
