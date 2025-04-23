'use client'

import { Link } from 'components/link'
import { type ComponentProps, type MouseEvent, type ReactNode } from 'react'

type Button = { onClick?: (e: MouseEvent<HTMLButtonElement>) => void }
type Anchor = {
  href: ComponentProps<typeof Link>['href']
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

type TabProps = {
  border?: boolean
  children: ReactNode
  disabled?: boolean
  selected?: boolean
} & (Anchor | Button)

const tabIsLink = (value: Button | Anchor): value is Anchor =>
  (value as Anchor).href !== undefined

export const Tab = function ({
  border = false,
  children,
  disabled = false,
  selected = false,
  ...props
}: TabProps) {
  const isLink = tabIsLink(props)
  return (
    <li
      className={`
      box-border flex h-7 flex-1 items-center rounded-md px-2 py-1 text-sm font-medium md:flex-auto [&>a]:w-full
      ${
        selected
          ? 'border border-solid border-neutral-300/55 bg-white text-neutral-950 shadow-sm'
          : `${
              border ? 'border border-solid border-neutral-300/55' : ''
            } cursor-pointer bg-neutral-100 text-neutral-600 hover:text-neutral-950`
      }
    `}
    >
      {(!isLink || disabled) && (
        <button
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
