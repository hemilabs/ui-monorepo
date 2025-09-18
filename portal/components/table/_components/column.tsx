import { ComponentProps } from 'react'

export const Column = ({ className, ...props }: ComponentProps<'td'>) => (
  <td
    className={`flex h-16 w-full flex-grow cursor-pointer items-center border-b border-solid 
      border-neutral-300/55 py-2.5 group-hover/row:bg-neutral-50 first:[&>*]:pl-4 last:[&>*]:pr-4 ${className}`}
    {...props}
  />
)
