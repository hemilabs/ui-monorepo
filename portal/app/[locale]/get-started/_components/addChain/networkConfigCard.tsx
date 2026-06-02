import { ComponentProps } from 'react'

export const NetworkConfigCard = ({
  className,
  ...props
}: ComponentProps<'div'>) => (
  <div
    className={`shadow-bs rounded-lg bg-white p-4 ${className ?? ''}`}
    {...props}
  />
)
