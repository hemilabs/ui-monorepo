import React from 'react'

const borderColors = {
  default: '',
  gray: 'border border-slate-100 border-solid',
} as const

const radiusVariants = {
  default: 'rounded-xl',
  large: 'rounded-[2.5rem]',
} as const

const shadows = {
  none: '',
  regular: 'shadow-[0px_1px_30px_0px_#00000026]',
} as const

type CardProps = React.DetailedHTMLProps<
  React.AllHTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  borderColor?: keyof typeof borderColors
  radius?: keyof typeof radiusVariants
  shadow?: keyof typeof shadows
}

export const Card = ({
  children,
  borderColor: variant,
  radius,
  shadow,
}: CardProps) => (
  <div
    className={`
                  relative
                  bg-white
                  px-5
                  py-3
                  ${borderColors[variant ?? 'default']} 
                  ${radiusVariants[radius ?? 'default']}
                  ${shadows[shadow ?? 'none']}
                `}
  >
    {children}
  </div>
)
