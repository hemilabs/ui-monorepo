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
  <div
    className={`flex h-5 w-9 shrink-0 items-center rounded-full ${
      checked ? 'bg-orange-600' : 'bg-neutral-100'
    } ${disabled ? 'opacity-40' : ''}`}
    style={{ boxShadow: '0px 0px 3px 0px rgba(0, 0, 0, 0.12) inset' }}
  >
    <input
      aria-label={ariaLabel}
      checked={checked}
      className={`border-[0.6px] border-solid border-neutral-300/55 ${
        checked ? 'ml-auto mr-0.5' : 'ml-0.5'
      } ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      } block size-4 appearance-none rounded-full bg-white`}
      disabled={disabled}
      id={id}
      name={id}
      onChange={e => onCheckedChange(e.target.checked)}
      onKeyDown={e => (e.key === 'Enter' ? e.preventDefault() : undefined)}
      type="checkbox"
    />
  </div>
)
