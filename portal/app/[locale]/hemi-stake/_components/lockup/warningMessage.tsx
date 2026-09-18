import { WarningIcon } from 'components/icons/warningIcon'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  isError?: boolean
}

export const WarningMessage = ({ children, isError = false }: Props) => (
  <div
    className={`ml-4 flex items-start gap-x-1 text-sm font-medium ${
      isError ? 'text-rose-500' : 'text-neutral-900'
    }`}
  >
    <span className="mt-0.5 shrink-0 leading-none">
      <WarningIcon />
    </span>
    <span>{children}</span>
  </div>
)
