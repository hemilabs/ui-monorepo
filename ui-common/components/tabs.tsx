'use client'

import Link from 'next-intl/link'
import { ReactNode } from 'react'

type Button = { onClick: () => void }
type Anchor = { href: string }

type TabProps = {
  children: ReactNode
  disabled?: boolean
  selected?: boolean
} & (Anchor | Button)

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function tabIsButton(value: Button | Anchor): value is Button {
  return (value as Button).onClick !== undefined
}

export const Tab = function ({
  children,
  disabled = false,
  selected = false,
  ...props
}: TabProps) {
  const isButton = tabIsButton(props)
  const className = `px-6 py-2 text-sm font-medium inline-block ${
    selected ? 'text-orange-950' : 'text-slate-300'
  }`
  return (
    <li className="border-y border-l border-solid border-slate-100 bg-white shadow-sm first:rounded-l-xl last:rounded-r-xl last:border-r">
      {isButton && (
        <button
          className={className}
          disabled={disabled || selected}
          onClick={props.onClick}
          type="button"
        >
          {children}
        </button>
      )}
      {!isButton && (
        <Link className={className} href={props.href}>
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
  <ul className="flex flex-wrap border-gray-200 text-center text-sm font-medium text-gray-500">
    {children}
  </ul>
)
