type Props = {
  // The visible setting label lives outside this component, so the input has no
  // text of its own to be named by.
  ariaLabel: string
  checked: boolean
  disabled?: boolean
  id: string
  onCheckedChange: (checked: boolean) => void
}

export const Toggle = ({
  ariaLabel,
  checked,
  disabled,
  id,
  onCheckedChange,
}: Props) => (
  <input
    aria-label={ariaLabel}
    checked={checked}
    className="flex h-5 w-10 shrink-0 cursor-pointer appearance-none items-center rounded-full bg-white shadow-bs transition-colors before:ml-1 before:block before:h-3 before:w-5 before:rounded-full before:bg-white before:shadow-sm before:transition-transform checked:bg-orange-600 checked:before:translate-x-3 focus:outline-none focus-visible:shadow-toggle-primary-focused enabled:hover:bg-neutral-50 checked:enabled:hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-55"
    disabled={disabled}
    id={id}
    name={id}
    onChange={e => onCheckedChange(e.target.checked)}
    onKeyDown={e => (e.key === 'Enter' ? e.preventDefault() : undefined)}
    role="switch"
    type="checkbox"
  />
)
