type Props = {
  className?: string
}

export const XCircleIcon = ({ className }: Props) => (
  <svg
    className={className}
    fill="none"
    height={16}
    width={16}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm-2.03-9.03a.75.75 0 0 1 1.06 0L8 6.94l.97-.97a.75.75 0 1 1 1.06 1.06L9.06 8l.97.97a.75.75 0 1 1-1.06 1.06L8 9.06l-.97.97a.75.75 0 0 1-1.06-1.06L6.94 8l-.97-.97a.75.75 0 0 1 0-1.06Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)
