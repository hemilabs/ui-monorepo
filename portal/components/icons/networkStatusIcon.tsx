import { ComponentProps } from 'react'

export const NetworkStatusIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    viewBox="0 0 12 12"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M10 0a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-1ZM4.5 4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V4ZM0 7a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V7Z"
      fill="#A3A3A3"
    />
  </svg>
)
