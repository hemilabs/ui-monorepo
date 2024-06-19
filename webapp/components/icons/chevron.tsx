const ChevronBase = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="16"
    width="22"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="m13 7.25-4 4-4-4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={1.2}
    />
  </svg>
)

type Props = { className?: string }

const Left = ({ className = '' }: Props) => (
  <ChevronBase className={`rotate-90 ${className}"`} />
)

const Right = ({ className = '' }: Props) => (
  <ChevronBase className={`-rotate-90 ${className}`} />
)

const Up = ({ className = '' }: Props) => (
  <ChevronBase className={`scale-y-[-1] ${className}`} />
)

export const Chevron = {
  Bottom: ChevronBase,
  Left,
  Right,
  Up,
}
