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
    ? 'bg-orange-600 hover:bg-orange-500 has-[:disabled]:hover:bg-orange-600'
    : 'bg-white shadow-bs hover:bg-neutral-50 has-[:disabled]:hover:bg-white'

  return (
    <label
      className={`flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-55 has-[:focus-visible]:shadow-toggle-primary-focused ${trackStyles}`}
    >
      <input
        aria-label={ariaLabel}
        checked={checked}
        className={`${
          checked ? 'translate-x-3' : 'translate-x-0'
        } ml-1 block h-3 w-5 cursor-pointer appearance-none rounded-full bg-white shadow-sm transition-transform focus:outline-none disabled:cursor-not-allowed`}
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
