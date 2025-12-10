import { ComponentProps } from 'react'

export const ExplorerIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={12}
    width={12}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M3.37.186A1.25 1.25 0 0 1 4.584.132l3.378 1.69L10.095.509A1.25 1.25 0 0 1 12 1.573v7.326c0 .434-.225.837-.595 1.065L8.63 11.672a1.25 1.25 0 0 1-1.214.053l-3.378-1.69-2.133 1.314A1.25 1.25 0 0 1 0 10.283V2.958c0-.434.225-.837.595-1.064L3.37.186ZM4 1.929a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm4.75 2.75a.75.75 0 1 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5Z"
      fill="#A3A3A3"
      fillRule="evenodd"
    />
  </svg>
)
