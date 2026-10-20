import { WarningIcon } from 'components/icons/warningIcon'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export const WarningMessage = ({ children }: Props) => (
  <div className="ml-4 flex items-start gap-x-1 text-sm font-medium text-neutral-900">
    <span className="mt-0.5 shrink-0 leading-none">
      <WarningIcon />
    </span>
    <span>{children}</span>
  </div>
)
