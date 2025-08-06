import { ComponentProps } from 'react'

export const ColumnHeader = ({
  children,
  className = '',
  style,
}: ComponentProps<'th'>) => (
  <th
    className={`border-color-neutral/55 flex w-full flex-grow items-center ${className} h-10 border-b
    border-t border-solid bg-neutral-50 font-medium first:rounded-l-lg first:border-l last:rounded-r-lg
    last:border-r first:[&>span]:pl-4 last:[&>span]:pl-5`}
    style={style}
  >
    {children}
  </th>
)

export const Column = (props: ComponentProps<'td'>) => (
  <td
    className={`h-13 flex w-full flex-grow cursor-pointer items-center border-b border-solid 
      border-neutral-300/55 py-2.5 last:pr-2.5 group-hover/stake-row:bg-neutral-50 first:[&>*]:pl-4 last:[&>*]:pl-5`}
    {...props}
  />
)

export const Header = ({ text }: { text: string }) => (
  <span className="block py-2 text-left font-semibold text-neutral-600">
    {text}
  </span>
)
