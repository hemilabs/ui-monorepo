import { ComponentProps } from 'react'

export const HamburgerIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={16}
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M2 4.75A.75.75 0 0 1 2.75 4h10.5a.75.75 0 1 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 6.5a.75.75 0 0 1 .75-.75h10.5a.75.75 0 1 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
      fill="#737373"
      fillRule="evenodd"
    />
  </svg>
)
