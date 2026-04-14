import { type ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  onClick: VoidFunction
  selected: boolean
}

export const SegmentedControlItem = ({
  children,
  className = '',
  onClick,
  selected,
}: Props) => (
  <button
    className={`flex h-7 cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-2.5 text-xs font-semibold leading-4 tracking-wide ${
      selected
        ? 'bg-white text-neutral-950 shadow-sm'
        : 'bg-neutral-100 text-neutral-700 hover:text-neutral-950'
    } ${className}`}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
)
