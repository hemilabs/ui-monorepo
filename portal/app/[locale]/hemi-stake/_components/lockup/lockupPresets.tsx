type Preset = {
  days: number
  label: string
  sublabel?: string
}

type Props = {
  labelledBy: string
  minLocked?: number
  onSelect: (days: number) => void
  options: Preset[]
  value: number
}

export const LockupPresets = function ({
  labelledBy,
  minLocked,
  onSelect,
  options,
  value,
}: Props) {
  const hasSublabels = options.some(({ sublabel }) => sublabel !== undefined)

  return (
    <div
      aria-labelledby={labelledBy}
      className="grid w-full grid-cols-2 rounded-lg bg-white p-1 shadow-lockup-input-default xs:grid-cols-4"
      role="group"
    >
      {options.map(function ({ days, label, sublabel }) {
        const disabled = !!minLocked && days < minLocked
        const selected = days === value

        const stateClassName = function () {
          if (disabled) {
            return 'cursor-default text-neutral-400'
          }
          if (selected) {
            return 'bg-orange-50 text-orange-600 ring-1.5 ring-inset ring-orange-600'
          }
          return 'text-neutral-950 hover:bg-neutral-100'
        }

        return (
          <button
            aria-pressed={selected}
            className={`flex ${hasSublabels ? 'h-12' : 'h-9'} min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden whitespace-nowrap rounded-md py-1.5 transition-colors ${stateClassName()}`}
            disabled={disabled}
            key={days}
            onClick={() => onSelect(days)}
            type="button"
          >
            <span className="body-text-semibold">{label}</span>
            {sublabel !== undefined && (
              <span
                className={`text-xs font-medium ${
                  selected || disabled ? '' : 'text-neutral-500'
                }`}
              >
                {sublabel}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
