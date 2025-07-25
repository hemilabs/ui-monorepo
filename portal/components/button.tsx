import { Link } from 'components/link'
import { ComponentProps } from 'react'
import { simpleMergeTailwindClasses } from 'utils/simpleMergeTailwindClasses'
import { isRelativeUrl } from 'utils/url'

import { ExternalLink } from './externalLink'

const commonCss = `box-border flex items-center justify-center
  rounded-lg py-1.5 font-medium disabled:opacity-50`

const variants = {
  primary: `primary-button border-button-primary bg-button-primary text-white 
  transition-all duration-200 hover:bg-button-primary-hovered 
  disabled:bg-button-primary-disabled disabled:shadow-button-primary-disabled shadow-button-primary 
  focus:shadow-button-primary-focused border border-solid`,
  secondary: `text-neutral-950 bg-white hover:bg-neutral-50 disabled:bg-neutral-50 
  shadow-button-secondary focus:shadow-button-secondary-focused disabled:shadow-button-secondary-disabled`,
  tertiary: `text-neutral-950 bg-transparent hover:bg-neutral-100 focus:bg-neutral-100 focus:shadow-button-tertiary-focused`,
} as const

type Variant = {
  variant?: keyof typeof variants
}

export type ButtonSize = 'xSmall' | 'small' | 'xLarge'

const sizeMap: Record<ButtonSize, string> = {
  small: 'h-8 text-sm gap-x-2 px-3',
  xLarge: 'h-11 text-mid gap-x-2 px-4',
  xSmall: 'h-7 text-xs gap-x-1 px-2.5',
} as const

type Size = {
  size?: keyof typeof sizeMap
}

type ButtonProps = ComponentProps<'button'> & Variant & Size

type ButtonLinkProps = Omit<ComponentProps<'a'>, 'href' | 'ref'> &
  Required<Pick<ComponentProps<typeof Link>, 'href'>> &
  Variant &
  Size

export function Button({
  className,
  size = 'small',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const finalClassName = simpleMergeTailwindClasses({
    classLists: [commonCss, sizeMap[size], variants[variant], className],
  })

  return <button className={finalClassName} {...props} />
}

export const ButtonLink = function ({
  className,
  size = 'small',
  variant = 'primary',
  ...props
}: ButtonLinkProps) {
  const finalClassName = simpleMergeTailwindClasses({
    classLists: [commonCss, sizeMap[size], variants[variant], className],
  })

  if (
    !props.href ||
    (typeof props.href === 'string' && !isRelativeUrl(props.href))
  ) {
    return (
      <ExternalLink
        className={finalClassName}
        {...props}
        href={props.href as string | undefined}
      />
    )
  }
  return <Link className={finalClassName} {...props} />
}
