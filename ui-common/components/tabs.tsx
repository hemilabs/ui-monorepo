import { ReactNode } from 'react'

type TabProps = {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  selected?: boolean
}

export const Tab = ({
  children,
  disabled = false,
  onClick,
  selected = false,
}: TabProps) => (
  <li className="border-y border-l border-solid border-slate-100 bg-white shadow-sm first:rounded-l-xl last:rounded-r-xl last:border-r">
    <button
      className={`px-6 py-2 text-sm font-medium ${
        selected ? 'text-orange-950' : 'text-slate-300'
      }`}
      disabled={disabled || selected}
      onClick={() => onClick?.()}
      type="button"
    >
      {children}
    </button>
  </li>
)

type TabsProps = {
  children: ReactNode
}

export const Tabs = ({ children }: TabsProps) => (
  <ul className="flex flex-wrap border-gray-200 text-center text-sm font-medium text-gray-500">
    {children}
  </ul>
)
