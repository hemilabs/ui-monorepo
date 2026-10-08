type Option = {
  label: string
  value: string
}

type Props = {
  label: string
  onSelect: (value: string) => void
  options: Option[]
  value: string
}

export const AmountPresets = ({ label, onSelect, options, value }: Props) => (
  <div
    aria-label={label}
    className="flex min-w-0 flex-wrap items-center justify-end gap-1.5"
    role="group"
  >
    {options.map(function (option) {
      const selected = option.value === value

      const stateClassName = selected
        ? 'border-orange-600 bg-orange-50 text-orange-600'
        : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'

      return (
        <button
          aria-pressed={selected}
          className={`h-6 shrink-0 whitespace-nowrap rounded-md border border-solid px-2 text-xs font-medium transition-colors ${stateClassName}`}
          key={option.value}
          onClick={() => onSelect(option.value)}
          type="button"
        >
          {option.label}
        </button>
      )
    })}
  </div>
)
