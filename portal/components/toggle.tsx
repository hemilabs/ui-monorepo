type Props = {
  // The visible setting label lives outside this component, so the input has no
  // text of its own to be named by.
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
    <label
      className={`flex h-5 w-10 shrink-0 items-center rounded-full transition-colors has-[:focus-visible]:shadow-toggle-primary-focused ${trackStyles} ${
        disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'
      }`}
      htmlFor={id}
    >
      <input
        aria-label={ariaLabel}
        checked={checked}
        className={`${checked ? 'translate-x-3' : 'translate-x-0'} ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } ml-1 block h-3 w-5 appearance-none rounded-full bg-white shadow-sm transition-transform focus:outline-none`}
        disabled={disabled}
        id={id}
        name={id}
        onChange={e => onCheckedChange(e.target.checked)}
        onKeyDown={e => (e.key === 'Enter' ? e.preventDefault() : undefined)}
        type="checkbox"
      />
    </label>
  )
}
