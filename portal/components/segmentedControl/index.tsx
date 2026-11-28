import { Tooltip } from 'components/tooltip'
import { type ReactNode } from 'react'

import { SegmentedControlItem } from './item'

export type SegmentedControlOption<T extends string> = {
  disabled?: boolean
  label: ReactNode
  tooltip?: string
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
  <div
    aria-label={label}
    className="flex flex-wrap items-center gap-2"
    role="group"
  >
    {options.map(option => (
      <Tooltip key={option.value} text={option.tooltip} variant="simple">
        <SegmentedControlItem
          className={fullWidth ? 'flex-1' : undefined}
          disabled={option.disabled}
          onClick={function () {
            if (!option.disabled && option.value !== value) {
              onChange(option.value)
            }
          }}
          selected={option.value === value}
        >
          {option.label}
        </SegmentedControlItem>
      </Tooltip>
    ))}
  </div>
)
