import { ComponentProps } from 'react'

export const PlusSignIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={16}
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect fill="#F5F5F5" height={16} rx={3} width={16} />
    <path
      d="M8.563 4.813a.563.563 0 0 0-1.126 0v2.625H4.813a.563.563 0 0 0 0 1.125h2.625v2.624a.562.562 0 1 0 1.125 0V8.563h2.626a.562.562 0 1 0 0-1.126H8.562V4.813Z"
      fill="#171717"
    />
  </svg>
)
