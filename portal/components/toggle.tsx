type Props = {
  ariaLabel: string
  checked: boolean
  disabled?: boolean
  id: string
  onCheckedChange: (checked: boolean) => void
}

export const Toggle = function ({
  ariaLabel,
  checked,
  disabled,
  id,
  onCheckedChange,
}: Props) {
  const trackStyles = checked
    ? `bg-orange-600 ${disabled ? '' : 'hover:bg-orange-500'}`
    : `bg-white shadow-bs ${disabled ? '' : 'hover:bg-neutral-50'}`

  return (
    <div
      className={`flex h-5 w-10 shrink-0 items-center rounded-full transition-colors ${trackStyles} ${
        disabled ? 'opacity-55' : ''
      }`}
    >
      <input
        aria-label={ariaLabel}
        checked={checked}
        className={`${checked ? 'ml-auto mr-1' : 'ml-1'} ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } block h-3 w-5 appearance-none rounded-full bg-white shadow-sm`}
        disabled={disabled}
        id={id}
        name={id}
        onChange={e => onCheckedChange(e.target.checked)}
        onKeyDown={e => (e.key === 'Enter' ? e.preventDefault() : undefined)}
        type="checkbox"
      />
    </div>
  )
}
