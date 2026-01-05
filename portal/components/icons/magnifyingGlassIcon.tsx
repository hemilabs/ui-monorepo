type Props = {
  size?: 'xs' | 's' | 'xl'
}

const defaultSize = {
  height: 16,
  width: 16,
} as const

const iconSizes = {
  s: defaultSize,
  xl: {
    height: 24,
    width: 24,
  },
  xs: defaultSize,
} as const

export const MagnifyingGlassIcon = ({ size = 's' }: Props) => (
  <svg
    clip-rule="evenodd"
    fill="none"
    height={iconSizes[size].height}
    viewBox="0 0 18 18"
    width={iconSizes[size].width}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clip-rule="evenodd"
      d="M11.9482 13.5391C10.7037 14.4573 9.16521 15 7.5 15C3.35786 15 0 11.6421 0 7.5C0 3.35786 3.35786 0 7.5 0C11.6421 0 15 3.35786 15 7.5C15 9.16521 14.4573 10.7037 13.5391 11.9482L17.6705 16.0795C18.1098 16.5188 18.1098 17.2312 17.6705 17.6705C17.2312 18.1098 16.5188 18.1098 16.0795 17.6705L11.9482 13.5391ZM12.75 7.5C12.75 10.3995 10.3995 12.75 7.5 12.75C4.60051 12.75 2.25 10.3995 2.25 7.5C2.25 4.60051 4.60051 2.25 7.5 2.25C10.3995 2.25 12.75 4.60051 12.75 7.5Z"
      fill="#737373"
      fill-rule="evenodd"
    />
  </svg>
)
