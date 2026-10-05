import '@tanstack/react-table'
import { type AriaAttributes } from 'react'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    ariaSort?: AriaAttributes['aria-sort']
    className?: string
    width: number
  }
}
