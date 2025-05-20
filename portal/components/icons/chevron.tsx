import { ComponentProps } from 'react'

const Bottom = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={16}
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
      fill="#A3A3A3"
      fillRule="evenodd"
    />
  </svg>
)

type Props = { className?: string }

const Right = (props: Props) => (
  <svg
    fill="none"
    height={16}
    width={17}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M6.72 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L9.44 8 6.72 5.28a.75.75 0 0 1 0-1.06Z"
      fill="#A3A3A3"
      fillRule="evenodd"
    />
  </svg>
)

const Left = ({ className = '' }: Props) => (
  <Right className={`rotate-180 ${className}`} />
)

const Up = ({ className = '' }: Props) => (
  <Bottom className={`scale-y-[-1] ${className}`} />
)

export const Chevron = {
  Bottom,
  Left,
  Right,
  Up,
}
