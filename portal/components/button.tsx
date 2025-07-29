import { Link } from 'components/link'
import { ComponentProps } from 'react'
import { isRelativeUrl } from 'utils/url'

import { ExternalLink } from './externalLink'

const commonCss = `box-border flex items-center justify-center 
  font-medium disabled:opacity-50 focus:outline-none`

// Adds a smooth hover background effect using a before pseudo-element.
// This ensures consistent transitions across button variants by:
// - Creating a full-size background layer positioned behind the content (`before:absolute`, `before:inset-0`, `before:-z-10`)
// - Starting fully transparent (`before:opacity-0`) and transitioning to visible on hover (`hover:before:opacity-100`)
// - Applying a transition effect on opacity (`before:transition-opacity before:duration-200`)
const withBeforeTransition = `
  before:content-[''] before:absolute before:inset-0 before:-z-10
  before:opacity-0 hover:before:opacity-100
  before:transition-opacity before:duration-200
`

const variants = {
  primary: `
    relative z-10 overflow-hidden text-white bg-button-primary
    border border-button-primary shadow-button-primary
    disabled:bg-button-primary-disabled disabled:shadow-button-primary-disabled
    focus-visible:shadow-button-primary-focused
    ${withBeforeTransition} before:bg-button-primary-hovered
  `,
  secondary: `
    relative z-10 overflow-hidden text-neutral-950 bg-white
    shadow-button-secondary focus-visible:shadow-button-secondary-focused
    disabled:bg-neutral-50 disabled:shadow-button-secondary-disabled
    ${withBeforeTransition} before:bg-neutral-50
  `,
  tertiary: `
    relative z-10 overflow-hidden text-neutral-950 bg-transparent
    focus:bg-neutral-100 focus-visible:shadow-button-tertiary-focused
    ${withBeforeTransition} before:bg-neutral-100
  `,
} as const

export type ButtonSize = 'xSmall' | 'small' | 'xLarge'

/* eslint-disable sort-keys */
const buttonSizePresets = {
  xSmall: {
    icon: 'h-7 text-xs rounded-md min-w-7',
    regular: 'h-7 text-xs gap-x-1 px-2.5 rounded-md',
  },
  small: {
    icon: 'h-8 text-sm rounded-lg min-w-8',
    regular: 'h-8 text-sm gap-x-2 px-3 rounded-lg',
  },
  xLarge: {
    icon: 'h-11 text-mid rounded-lg min-w-11',
    regular: 'h-11 text-mid gap-x-2 px-4 rounded-lg',
  },
} as const
/* eslint-enable sort-keys */

type ButtonStyleProps = {
  variant?: keyof typeof variants
  size?: ButtonSize
}

type ButtonProps = Omit<ComponentProps<'button'>, 'className'> &
  ButtonStyleProps
type ButtonLinkProps = Omit<ComponentProps<'a'>, 'href' | 'ref' | 'className'> &
  Required<Pick<ComponentProps<typeof Link>, 'href'>> &
  ButtonStyleProps

export const Button = ({
  size = 'small',
  variant = 'primary',
  ...props
}: ButtonProps) => (
  <button
    className={`${commonCss} ${buttonSizePresets[size].regular} ${variants[variant]}`}
    {...props}
  />
)

export const ButtonIcon = ({
  size = 'small',
  variant = 'primary',
  ...props
}: ButtonProps) => (
  <button
    className={`${commonCss} ${buttonSizePresets[size].icon} ${variants[variant]}`}
    {...props}
  />
)

export const ButtonLink = function ({
  size = 'small',
  variant = 'primary',
  ...props
}: ButtonLinkProps) {
  const className = `${commonCss} ${buttonSizePresets[size].regular} ${variants[variant]}`
  if (
    !props.href ||
    (typeof props.href === 'string' && !isRelativeUrl(props.href))
  ) {
    return (
      <ExternalLink
        className={className}
        {...props}
        href={props.href as string | undefined}
      />
    )
  }
  return <Link className={className} {...props} />
}
