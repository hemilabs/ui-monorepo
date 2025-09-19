import { ComponentProps } from 'react'

export const ColumnHeader = ({
  children,
  className = '',
  style,
}: ComponentProps<'th'>) => (
  <th
    className={`flex w-full flex-grow items-center ${className} whitespace-nowrap font-medium first:[&>span]:pl-4 last:[&>span]:pr-4`}
    style={style}
  >
    {children}
  </th>
)
