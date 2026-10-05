import { ComponentProps } from 'react'

export const ColumnHeader = ({
  children,
  className = '',
  ...props
}: ComponentProps<'th'>) => (
  <th
    {...props}
    className={`flex w-full min-w-0 flex-grow items-center ${className} whitespace-nowrap font-medium first:pl-4 last:pr-4`}
  >
    {children}
  </th>
)
