'use client'

import Link from 'next-intl/link'
import { ReactNode } from 'react'

type Button = { onClick?: () => void }
type Anchor = { href: string }

type TabProps = {
  children: ReactNode
  disabled?: boolean
  selected?: boolean
} & (Anchor | Button)

const tabIsButton = (value: Button | Anchor): value is Button =>
  (value as Button).onClick !== undefined

export const Tab = function ({
  children,
  disabled = false,
  selected = false,
  ...props
}: TabProps) {
  const isButton = tabIsButton(props)
  return (
    <li
      className={`
      text-ms box-border flex h-7 items-center rounded-md px-2 py-1 font-medium
      ${
        selected
          ? 'border border-solid border-neutral-300/55 bg-white text-neutral-950 shadow-sm'
          : 'cursor-pointer bg-neutral-100 text-neutral-600 hover:text-neutral-950'
      }
    `}
    >
      {(isButton || disabled) && (
        <button
          disabled={disabled || selected}
          onClick={isButton && !disabled ? props.onClick : undefined}
          type="button"
        >
          {children}
        </button>
      )}
      {!isButton && props.href && <Link href={props.href}>{children}</Link>}
    </li>
  )
}

type TabsProps = {
  children: ReactNode
}

export const Tabs = ({ children }: TabsProps) => (
  <ul className="flex flex-wrap items-center gap-x-2">{children}</ul>
)
