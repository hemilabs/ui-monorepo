import { ComponentProps } from 'react'

const shadowVariants = {
  /* eslint-disable sort-keys */
  none: 'shadow-none',
  bs: 'shadow-bs',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  /* eslint-enable sort-keys */
} as const

type Props = ComponentProps<'div'> & { shadow?: keyof typeof shadowVariants }

export const Card = ({ shadow = 'md', ...props }: Props) => (
  <div
    className={`card-container rounded-xl bg-white ${shadowVariants[shadow]}`}
    {...props}
  />
)
