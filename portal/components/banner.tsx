import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export const Banner = ({ children }: Props) => (
  <div className="body-text-normal rounded-lg border border-solid border-orange-500/25 bg-orange-50 px-4 py-3 text-neutral-950">
    {children}
  </div>
)
