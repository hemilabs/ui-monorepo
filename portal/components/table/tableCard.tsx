import { ReactNode } from 'react'

// Full-height white card used for a table's empty / loading / connect states so
// they match the populated table's body (rounded-lg + shadow-sm). The height
// comes from the parent, matching whatever height the table occupies.
export const TableCard = ({ children }: { children: ReactNode }) => (
  <div className="h-full overflow-hidden rounded-lg bg-white shadow-sm">
    {children}
  </div>
)
