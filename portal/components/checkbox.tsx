import { type Ref } from 'react'

type Props = {
  checked: boolean
  className?: string
  label: string
  onChange: (checked: boolean) => void
  ref?: Ref<HTMLInputElement>
}

export const Checkbox = ({
  checked,
  className = '',
  label,
  onChange,
  ref,
}: Props) => (
  <label
    className={`flex cursor-pointer gap-x-2 text-neutral-950 ${className}`}
  >
    <span className="relative inline-flex shrink-0">
      <input
        checked={checked}
        className="size-4 cursor-pointer appearance-none rounded bg-white shadow-sm transition-colors checked:bg-orange-600 hover:bg-neutral-50 checked:hover:bg-orange-600 focus:ring-2 focus:ring-orange-600"
        onChange={e => onChange(e.target.checked)}
        ref={ref}
        type="checkbox"
      />
      {checked && (
        <svg
          className="pointer-events-none absolute left-0.5 top-0.5 size-3 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 12 12"
        >
          <path
            d="M2 6.5l2.5 2.5L10 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
    <span>{label}</span>
  </label>
)
