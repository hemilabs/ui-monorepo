import { ComponentProps } from 'react'

export const GetStartedTableColumn = ({
  className,
  ...props
}: ComponentProps<'td'>) => (
  <td
    className={`flex h-full min-h-16 w-full min-w-0 flex-grow items-center border-b border-solid border-neutral-100 py-2.5 first:[&>*]:pl-4 last:[&>*]:pr-4 ${
      className ?? ''
    }`}
    {...props}
  />
)
