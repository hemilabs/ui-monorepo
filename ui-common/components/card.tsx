import { ComponentProps } from 'react'

const borderColors = {
  default: '',
  gray: 'border border-slate-100 border-solid',
} as const

const paddingVariants = {
  large: 'p-6 md:p-9',
  medium: 'p-6',
  small: 'px-4 py-3',
}

const radiusVariants = {
  default: 'rounded-xl',
  large: 'rounded-3xl',
} as const

const shadows = {
  extraSoft:
    'shadow-[0px_64px_15px_0px_#00000001,_0px_32px_10px_0px_#00000002,_0px_16px_6px_0px_#00000003]',
  none: '',
  regular: 'shadow-[0px_1px_30px_0px_#00000026]',
  soft: 'shadow-[0px_88px_25px_0px_#00000000,_0px_56px_23px_0px_#00000000,_0px_32px_19px_0px_#00000003,_0px_14px_14px_0px_#00000005,_0px_4px_8px_0px_#00000005]',
} as const

type CardProps = ComponentProps<'div'> & {
  borderColor?: keyof typeof borderColors
  padding: keyof typeof paddingVariants
  radius?: keyof typeof radiusVariants
  shadow?: keyof typeof shadows
}

export const Card = ({
  children,
  borderColor: variant = 'default',
  padding,
  radius = 'default',
  shadow = 'none',
}: CardProps) => (
  <div
    className={`relative bg-white ${paddingVariants[padding]} ${borderColors[variant]} ${radiusVariants[radius]} ${shadows[shadow]}`}
  >
    {children}
  </div>
)
