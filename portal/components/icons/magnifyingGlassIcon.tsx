type Props = {
  size?: 'xs' | 's' | 'xl'
}

const defaultSize = {
  height: 16,
  viewBox: '0 0 16 16',
  width: 16,
} as const

const iconSizes = {
  s: defaultSize,
  xl: {
    height: 24,
    viewBox: '0 0 24 24',
    width: 24,
  },
  xs: defaultSize,
} as const

export const MagnifyingGlassIcon = ({ size = 's' }: Props) => (
  <svg
    clip-rule="evenodd"
    fill="none"
    height={iconSizes[size].height}
    viewBox={iconSizes[size].viewBox}
    width={iconSizes[size].width}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.96544 11.0261C9.13578 11.6382 8.11014 12 7 12C4.23858 12 2 9.76142 2 7C2 4.23858 4.23858 2 7 2C9.76142 2 12 4.23858 12 7C12 8.11014 11.6382 9.13578 11.0261 9.96544L13.7803 12.7197C14.0732 13.0126 14.0732 13.4874 13.7803 13.7803C13.4874 14.0732 13.0126 14.0732 12.7197 13.7803L9.96544 11.0261ZM10.5 7C10.5 8.933 8.933 10.5 7 10.5C5.067 10.5 3.5 8.933 3.5 7C3.5 5.067 5.067 3.5 7 3.5C8.933 3.5 10.5 5.067 10.5 7Z"
      fill="#737373"
      fill-rule="evenodd"
    />
  </svg>
)
