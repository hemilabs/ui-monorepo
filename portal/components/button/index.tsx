import { ExternalLink } from 'components/externalLink'
import { Link } from 'components/link'
import { ComponentProps } from 'react'
import { isRelativeUrl } from 'utils/url'

const variants = {
  primary: 'button--primary',
  secondary: 'button--secondary',
  tertiary: 'button--tertiary',
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
    className={`button--base ${buttonSizePresets[size].regular} ${variants[variant]}`}
    {...props}
  />
)

export const ButtonIcon = ({
  size = 'small',
  variant = 'primary',
  ...props
}: ButtonProps) => (
  <button
    className={`button--base  ${buttonSizePresets[size].icon} ${variants[variant]}`}
    {...props}
  />
)

export const ButtonLink = function ({
  size = 'small',
  variant = 'primary',
  ...props
}: ButtonLinkProps) {
  const className = `button--base ${buttonSizePresets[size].regular} ${variants[variant]}`
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
