type Props = {
  size?: 'xs' | 's' | 'xl'
}

const defaultSize = 'size-4'

const defaultPath =
  'M11.9482 13.5391C10.7037 14.4573 9.16521 15 7.5 15C3.35786 15 0 11.6421 0 7.5C0 3.35786 3.35786 0 7.5 0C11.6421 0 15 3.35786 15 7.5C15 9.16521 14.4573 10.7037 13.5391 11.9482L17.6705 16.0795C18.1098 16.5188 18.1098 17.2312 17.6705 17.6705C17.2312 18.1098 16.5188 18.1098 16.0795 17.6705L11.9482 13.5391ZM12.75 7.5C12.75 10.3995 10.3995 12.75 7.5 12.75C4.60051 12.75 2.25 10.3995 2.25 7.5C2.25 4.60051 4.60051 2.25 7.5 2.25C10.3995 2.25 12.75 4.60051 12.75 7.5Z'

const xlPath =
  'M14.9482 16.5391C13.7037 17.4573 12.1652 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5C18 12.1652 17.4573 13.7037 16.5391 14.9482L20.6705 19.0795C21.1098 19.5188 21.1098 20.2312 20.6705 20.6705C20.2312 21.1098 19.5188 21.1098 19.0795 20.6705L14.9482 16.5391ZM15.75 10.5C15.75 13.3995 13.3995 15.75 10.5 15.75C7.60051 15.75 5.25 13.3995 5.25 10.5C5.25 7.60051 7.60051 5.25 10.5 5.25C13.3995 5.25 15.75 7.60051 15.75 10.5Z'

const iconConfigs = {
  /* eslint-disable sort-keys */
  xs: {
    className: defaultSize,
    path: defaultPath,
    viewBox: '0 0 18 18',
  },
  s: {
    className: defaultSize,
    path: defaultPath,
    viewBox: '0 0 18 18',
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
