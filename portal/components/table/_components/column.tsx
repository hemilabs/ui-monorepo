import { ComponentProps } from 'react'

type Variant = 'default' | 'plain'

type ColumnProps = ComponentProps<'td'> & {
  variant?: Variant
}

const variantClassName: Record<Variant, string> = {
  default: 'cursor-pointer border-neutral-300/55 group-hover/row:bg-neutral-50',
  plain: 'border-neutral-100',
}

export const Column = ({
  className,
  variant = 'default',
  ...props
}: ColumnProps) => (
  <td
    className={`flex h-full min-h-16 w-full min-w-0 flex-grow items-center border-b border-solid py-2.5 first:[&>*]:pl-4 last:[&>*]:pr-4 ${
      variantClassName[variant]
    } ${className ?? ''}`}
    {...props}
  />
)
