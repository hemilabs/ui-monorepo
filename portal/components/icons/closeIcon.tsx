import { ComponentProps } from 'react'

export const CloseIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={16}
    viewBox="0 0 16 16"
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M4.06 3.31a.75.75 0 0 0-.53 1.281l7.425 7.425a.75.75 0 0 0 1.06-1.061L4.591 3.53a.75.75 0 0 0-.53-.22Z"
      fill="#737373"
    />
    <path
      d="M3.31 11.485a.75.75 0 0 0 1.281.53l7.425-7.424a.75.75 0 1 0-1.061-1.06L3.53 10.954a.75.75 0 0 0-.22.53Z"
      fill="#737373"
    />
  </svg>
)
