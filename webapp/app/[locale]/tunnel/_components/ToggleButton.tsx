const DoubleArrow = () => (
  <svg fill="none" height={20} width={20} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.25 17.5 2.5 13.75m0 0L6.25 10M2.5 13.75h11.25m0-11.25 3.75 3.75m0 0L13.75 10m3.75-3.75H6.25"
      stroke="#0A0A0A"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
  </svg>
)

type Props = {
  disabled: boolean
  toggle: () => void
}

export const ToggleButton = ({ disabled, toggle }: Props) => (
  <button
    className={`mx-auto rounded-lg border border-solid border-neutral-300/55 bg-white p-2 shadow-sm hover:bg-neutral-100 ${
      disabled ? 'cursor-not-allowed' : 'cursor-pointer'
    }`}
    disabled={disabled}
    onClick={toggle}
    type="button"
  >
    <DoubleArrow />
  </button>
)
