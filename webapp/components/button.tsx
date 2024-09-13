import { ComponentProps } from 'react'

const variants = {
  primary: `border-orange-700/55 from-orange-500 to-orange-600 text-white hover:border-orange-700/70  
    bg-gradient-to-b transition-all duration-300
    hover:from-orange-600 hover:to-orange-600 disabled:bg-orange-600 shadow-button-primary
    focus:shadow-button-primary-focused`,
  secondary: `text-neutral-950 bg-white border-neutral-300/55 hover:bg-neutral-100
    disabled:bg-neutral-100 shadow-button-secondary focus:shadow-button-secondary-focused`,
} as const

type Props = ComponentProps<'button'> & {
  variant?: keyof typeof variants
}

export const Button = ({ variant, ...props }: Props) => (
  <button
    className={`text-ms box-content flex h-8 items-center justify-center
      rounded-lg border border-solid px-3 py-1.5 font-medium leading-5 disabled:opacity-40
      ${variants[variant ?? 'primary']}
    `}
    {...props}
  />
)
