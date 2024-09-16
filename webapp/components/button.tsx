import { ComponentProps } from 'react'

const commonCss = `text-ms box-content flex items-center justify-center
  rounded-lg border border-solid px-3 py-1.5 font-medium leading-5 disabled:opacity-40`

const variants = {
  primary: `border-orange-700/55 from-orange-500 to-orange-600 text-white hover:border-orange-700/70  
    bg-gradient-to-b transition-all duration-300
    hover:from-orange-600 hover:to-orange-600 disabled:bg-orange-600 shadow-button-primary
    focus:shadow-button-primary-focused`,
  secondary: `text-neutral-950 bg-white border-neutral-300/55 hover:bg-neutral-100
    disabled:bg-neutral-100 shadow-button-secondary focus:shadow-button-secondary-focused`,
} as const

type Height = {
  height?: 'h-6' | 'h-8'
}

type Variant = {
  variant?: keyof typeof variants
}

type ButtonProps = ComponentProps<'button'> & Variant & Height

type ButtonLinkProps = ComponentProps<'a'> & Variant

export const Button = ({ height = 'h-8', variant, ...props }: ButtonProps) => (
  <button
    className={`${commonCss} ${height} ${variants[variant ?? 'primary']}`}
    {...props}
  />
)

export const ButtonLink = ({ variant, ...props }: ButtonLinkProps) => (
  <a
    className={`${commonCss} px-2 ${variants[variant ?? 'primary']}`}
    {...props}
  />
)
