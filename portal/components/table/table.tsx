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

export const Column = ({ className, ...props }: ComponentProps<'td'>) => (
  <td
    className={`flex h-16 w-full flex-grow cursor-pointer items-center border-b border-solid 
      border-neutral-300/55 py-2.5 group-hover/row:bg-neutral-50 first:[&>*]:pl-4 last:[&>*]:pr-4 ${className}`}
    {...props}
  />
)

export const Header = ({ text }: { text: string }) => (
  <span className="block py-3 text-left font-semibold text-neutral-600">
    {text}
  </span>
)
