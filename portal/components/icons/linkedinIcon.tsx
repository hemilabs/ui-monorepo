import { ComponentProps } from 'react'

export const LinkedinIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={15}
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M3.333 1.667A1.667 1.667 0 1 1 0 1.667a1.667 1.667 0 0 1 3.333.002Zm.05 2.9H.05v10.434h3.333V4.567Zm5.267 0H5.333v10.434h3.284V9.526c0-3.05 3.975-3.333 3.975 0V15h3.291V8.393c0-5.142-5.883-4.95-7.266-2.426l.033-1.4Z"
      fill="#737373"
    />
  </svg>
)
