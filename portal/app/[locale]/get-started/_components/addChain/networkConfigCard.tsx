import { ComponentProps } from 'react'

export const NetworkConfigCard = ({
  className,
  ...props
}: ComponentProps<'div'>) => (
  <div
    className={`rounded-lg bg-white p-4 shadow-bs ${className ?? ''}`}
    {...props}
  />
)
