import { ReactNode } from 'react'

export const FeesContainer = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-y-1 px-8 py-4 text-sm md:px-10">
    {children}
  </div>
)
