import { WarningIcon } from 'components/icons/warningIcon'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

export const WarningMessage = ({ children, className = '' }: Props) => (
  <div
    className={`flex items-start gap-x-1 text-sm font-medium text-neutral-900 ${className}`}
  >
    <span className="mt-0.5 shrink-0 leading-none">
      <WarningIcon />
    </span>
    <span>{children}</span>
  </div>
)
