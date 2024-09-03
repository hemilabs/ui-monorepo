import { ComponentProps } from 'react'

export const ElectroCardiogramIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={14}
    width={14}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1.167 7h1.906c.254 0 .48-.165.556-.408L5.111 1.9a.146.146 0 0 1 .278 0L8.611 12.1a.146.146 0 0 0 .278 0l1.483-4.693A.583.583 0 0 1 10.928 7h1.906"
      stroke="#A3A3A3"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.167}
    />
  </svg>
)
