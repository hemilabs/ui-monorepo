'use client'

import { Link } from 'components/link'
import { type ComponentProps, type MouseEvent, type ReactNode } from 'react'

type Button = { onClick?: (e: MouseEvent<HTMLButtonElement>) => void }
type Anchor = {
  href: ComponentProps<typeof Link>['href']
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

type TabSize = 'xSmall' | 'small'

type TabProps = {
  children: ReactNode
  disabled?: boolean
  selected?: boolean
  size?: TabSize
} & (Anchor | Button)

const tabIsLink = (value: Button | Anchor): value is Anchor =>
  (value as Anchor).href !== undefined

/* eslint-disable sort-keys */
const tabSizePresets = {
  xSmall: 'h-7 text-xs rounded-md px-2.5',
  small: 'h-8 text-sm rounded-xs px-3',
} as const
/* eslint-enable sort-keys */

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
      box-border flex ${
        tabSizePresets[size]
      } flex-1 items-center py-1 font-medium transition-colors duration-300 md:flex-auto [&>a]:w-full
      ${
        selected
          ? 'shadow-tab-active bg-white text-neutral-950'
          : 'cursor-pointer bg-neutral-100 text-neutral-700 hover:text-neutral-950'
      }
    `}
    >
      {(!isLink || disabled) && (
        <button
          className="w-full"
          disabled={disabled || selected}
          onClick={!isLink && !disabled ? props.onClick : undefined}
          type="button"
        >
          {children}
        </button>
      )}
      {isLink && props.href && (
        <Link href={props.href} onClick={props.onClick}>
          {children}
        </Link>
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
