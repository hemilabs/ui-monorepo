import { type ReactNode } from 'react'

export const StatBadge = ({ children }: { children: ReactNode }) => (
  <span className="flex w-fit items-center gap-x-1 rounded-md border border-solid border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-xxs font-medium text-neutral-600">
    {children}
  </span>
)
