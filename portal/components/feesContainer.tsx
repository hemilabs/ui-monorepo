import { ReactNode } from 'react'

const baseClassName = 'flex flex-col gap-y-1 py-4 text-sm'

export const FeesContainer = ({
  children,
  compact = false,
}: {
  children: ReactNode
  compact?: boolean
}) => (
  <div className={`${baseClassName} ${compact ? 'px-4' : 'px-8'}`}>
    {children}
  </div>
)
