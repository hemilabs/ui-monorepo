import { type ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  disabled?: boolean
  onClick: VoidFunction
  selected: boolean
}

const getStateStyles = function (disabled: boolean, selected: boolean) {
  if (disabled) {
    return 'cursor-not-allowed bg-neutral-100 text-neutral-400'
  }
  if (selected) {
    return 'cursor-pointer bg-white text-neutral-950 shadow-sm'
  }
  return 'cursor-pointer bg-neutral-100 text-neutral-700 hover:text-neutral-950'
}

export const SegmentedControlItem = ({
  children,
  className = '',
  disabled = false,
  onClick,
  selected,
}: Props) => (
  <button
    aria-disabled={disabled}
    aria-pressed={selected}
    className={`flex h-7 items-center justify-center whitespace-nowrap rounded-md px-2.5 text-xs font-semibold leading-4 tracking-wide ${getStateStyles(
      disabled,
      selected,
    )} ${className}`}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
)
