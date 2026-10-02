import { type ReactNode } from 'react'

import { SegmentedControlItem } from './item'

export type SegmentedControlOption<T extends string> = {
  label: ReactNode
  value: T
}

type Props<T extends string> = {
  fullWidth?: boolean
  label: string
  onChange: (value: T) => void
  options: SegmentedControlOption<NoInfer<T>>[]
  value: T
}

export const SegmentedControl = <T extends string>({
  fullWidth = false,
  label,
  onChange,
  options,
  value,
}: Props<T>) => (
  <div aria-label={label} className="flex items-center gap-2" role="group">
    {options.map(option => (
      <SegmentedControlItem
        className={fullWidth ? 'flex-1' : undefined}
        key={option.value}
        onClick={function () {
          if (option.value !== value) {
            onChange(option.value)
          }
        }}
        selected={option.value === value}
      >
        {option.label}
      </SegmentedControlItem>
    ))}
  </div>
)
