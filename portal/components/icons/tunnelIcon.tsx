import { ComponentProps } from 'react'

export const TunnelIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={12}
    width={12}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M11.78 8.47a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 0 1-1.06 0L6.22 9.53a.75.75 0 1 1 1.06-1.06l.97.97V3.75a.75.75 0 0 1 1.5 0v5.69l.97-.97a.75.75 0 0 1 1.06 0ZM.22 3.53a.75.75 0 0 1 0-1.06L2.47.22a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1-1.06 1.06l-.97-.97v5.69a.75.75 0 0 1-1.5 0V2.56l-.97.97a.75.75 0 0 1-1.06 0Z"
      fill="#A3A3A3"
      fillRule="evenodd"
    />
  </svg>
)
