import { ComponentProps } from 'react'

export const NetworkConfigCard = ({
  className = '',
  ...props
}: ComponentProps<'div'>) => (
  <div
    className={`rounded-lg bg-white p-4 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.05)] ${className}`}
    {...props}
  />
)
