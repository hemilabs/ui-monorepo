import { ComponentProps } from 'react'

const sizes = {
  small: 'py-px',
  xSmall: 'h-4',
} as const

const variants = {
  negative: 'bg-rose-50 text-rose-600',
  negativeB: 'bg-rose-600 text-rose-50',
  positive: 'bg-emerald-100 text-emerald-600',
  primary: 'bg-orange-100 text-orange-600',
  primaryB: 'bg-orange-600 text-white',
  secondary: 'bg-neutral-50 text-neutral-600 shadow-bs',
} as const

type Props = Omit<ComponentProps<'span'>, 'className'> & {
  size?: keyof typeof sizes
  variant?: keyof typeof variants
}

export const Badge = ({
  size = 'xSmall',
  variant = 'primary',
  ...props
}: Props) => (
  <span
    className={`body-text-caption inline-flex items-center justify-center overflow-hidden rounded-md px-1.5 ${sizes[size]} ${variants[variant]}`}
    {...props}
  />
)
