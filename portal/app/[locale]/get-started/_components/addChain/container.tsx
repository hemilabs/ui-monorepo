import { type ComponentProps } from 'react'

export const Container = ({
  className = '',
  ...props
}: ComponentProps<'div'>) => (
  <div
    className={`border-neutral/55 flex flex-col rounded-xl border border-solid
      p-4 text-sm font-medium ${className}`}
    {...props}
  />
)
