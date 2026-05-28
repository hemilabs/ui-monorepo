import { type ComponentProps } from 'react'

// Mirrors `components/table/_components/column.tsx` exactly except for the
// row min-height: `min-h-12` instead of `min-h-16` so the row honours the
// `rowSize={48}` passed to `<Table>`. Keeping the rest (incl. `flex-grow`)
// identical guarantees body cells align vertically with the header columns
// (which use `ColumnHeader` with its own `flex-grow`).
export const CompactCell = ({ className, ...props }: ComponentProps<'td'>) => (
  <td
    className={`flex h-full min-h-12 w-full min-w-0 flex-grow cursor-pointer items-center
      border-b border-solid border-neutral-300/55 py-2.5 group-hover/row:bg-neutral-50
      first:[&>*]:pl-4 last:[&>*]:pr-4 ${className ?? ''}`}
    {...props}
  />
)
