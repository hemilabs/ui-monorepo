import { ExternalLink } from 'components/externalLink'
import { Link } from 'components/link'
import { ComponentProps } from 'react'
import { isRelativeUrl } from 'utils/url'

const variants = {
  primary: 'button-primary',
  secondary: 'button-secondary',
  tertiary: 'button-tertiary',
} as const

export type ButtonSize = 'xSmall' | 'small' | 'xLarge'

/* eslint-disable sort-keys */
const buttonSizePresets = {
  xSmall: {
    icon: 'button-x-small button-icon',
    regular: 'button-x-small button-regular',
  },
  small: {
    icon: 'button-small button-icon',
    regular: 'button-small button-regular',
  },
  xLarge: {
    icon: 'button-x-large button-icon',
    regular: 'button-x-large button-regular',
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
    className={`button--base ${buttonSizePresets[size].icon} ${variants[variant]}`}
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
