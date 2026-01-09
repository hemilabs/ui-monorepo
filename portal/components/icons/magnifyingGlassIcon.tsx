type Props = {
  size?: 'xs' | 's' | 'xl'
}

const defaultSize = 'size-4'

const defaultPath =
  'M9.96544 11.0261C9.13578 11.6382 8.11014 12 7 12C4.23858 12 2 9.76142 2 7C2 4.23858 4.23858 2 7 2C9.76142 2 12 4.23858 12 7C12 8.11014 11.6382 9.13578 11.0261 9.96544L13.7803 12.7197C14.0732 13.0126 14.0732 13.4874 13.7803 13.7803C13.4874 14.0732 13.0126 14.0732 12.7197 13.7803L9.96544 11.0261ZM10.5 7C10.5 8.933 8.933 10.5 7 10.5C5.067 10.5 3.5 8.933 3.5 7C3.5 5.067 5.067 3.5 7 3.5C8.933 3.5 10.5 5.067 10.5 7Z'

const xlPath =
  'M14.9482 16.5391C13.7037 17.4573 12.1652 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5C18 12.1652 17.4573 13.7037 16.5391 14.9482L20.6705 19.0795C21.1098 19.5188 21.1098 20.2312 20.6705 20.6705C20.2312 21.1098 19.5188 21.1098 19.0795 20.6705L14.9482 16.5391ZM15.75 10.5C15.75 13.3995 13.3995 15.75 10.5 15.75C7.60051 15.75 5.25 13.3995 5.25 10.5C5.25 7.60051 7.60051 5.25 10.5 5.25C13.3995 5.25 15.75 7.60051 15.75 10.5Z'

const iconConfigs = {
  /* eslint-disable sort-keys */
  xs: {
    className: defaultSize,
    path: defaultPath,
    viewBox: '0 0 16 16',
  },
  s: {
    className: defaultSize,
    path: defaultPath,
    viewBox: '0 0 16 16',
  },
  xl: {
    className: 'size-6',
    path: xlPath,
    viewBox: '0 0 24 24',
  },
  /* eslint-enable sort-keys */
} as const

export const MagnifyingGlassIcon = ({ size = 's' }: Props) => (
  <svg
    className={iconConfigs[size].className}
    clipRule="evenodd"
    fill="none"
    viewBox={iconConfigs[size].viewBox}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d={iconConfigs[size].path}
      fill="#737373"
      fillRule="evenodd"
    />
  </svg>
)
