'use client'

import { Link } from 'components/link'
import { type ComponentProps, type MouseEvent, type ReactNode } from 'react'

import { Button, ButtonLink, type ButtonSize } from './button'

type Button = { onClick?: (e: MouseEvent<HTMLButtonElement>) => void }
type Anchor = {
  href: ComponentProps<typeof Link>['href']
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

type TabProps = {
  children: ReactNode
  disabled?: boolean
  selected?: boolean
  size?: Exclude<ButtonSize, 'xLarge'>
} & (Anchor | Button)

const tabIsLink = (value: Button | Anchor): value is Anchor =>
  (value as Anchor).href !== undefined

export const Tab = function ({
  children,
  disabled = false,
  selected = false,
  size = 'xSmall',
  ...props
}: TabProps) {
  const isLink = tabIsLink(props)
  return (
    <li
      className={`
        flex flex-1 items-center py-1 *:w-full md:flex-auto
      ${
        selected
          ? '*:duration-600 before:*:duration-600 *:cursor-default *:bg-white *:transition-colors before:*:bg-white before:*:transition-colors hover:before:*:bg-white'
          : '*:duration-600 before:*:duration-600 *:bg-neutral-100 *:text-neutral-700 *:shadow-none *:transition-colors before:*:bg-neutral-100 before:*:transition-colors hover:*:text-neutral-950'
      }
    `}
    >
      {(!isLink || disabled) && (
        <Button
          disabled={disabled}
          onClick={
            !isLink && !disabled && !selected ? props.onClick : undefined
          }
          size={size}
          variant="secondary"
        >
          {children}
        </Button>
      )}
      {isLink && props.href && (
        <ButtonLink
          href={props.href}
          onClick={selected ? undefined : props.onClick}
          size={size}
          variant="secondary"
        >
          {children}
        </ButtonLink>
      )}
    </li>
  )
}

type TabsProps = {
  children: ReactNode
}

export const Tabs = ({ children }: TabsProps) => (
  <ul className="flex w-full flex-wrap items-center gap-x-2 gap-y-1">
    {children}
  </ul>
)
