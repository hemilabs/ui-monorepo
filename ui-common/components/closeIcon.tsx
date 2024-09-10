import { ComponentProps } from 'react'

export const CloseIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={20}
    width={20}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="m4.167 4.166 11.666 11.667m0-11.667L4.167 15.833"
      stroke="#737373"
      strokeLinecap="round"
      strokeWidth={2}
    />
  </svg>
)
