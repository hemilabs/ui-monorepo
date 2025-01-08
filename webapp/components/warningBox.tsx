import { WarningIcon } from 'components/icons/warningIcon'
import { ReactNode } from 'react'
import { CloseIcon } from 'ui-common/components/closeIcon'

type Props = {
  heading: string
  // Use react Node to allow rich translated components
  subheading: ReactNode
  onClose?: () => void
}

export const WarningBox = ({ heading, onClose, subheading }: Props) => (
  <div className="flex flex-col gap-y-1 rounded-lg bg-neutral-50 p-4 text-sm font-medium">
    <div className="flex items-center gap-x-1">
      <WarningIcon />
      <p className="text-neutral-900">{heading}</p>
      {!!onClose && (
        <CloseIcon
          className="cursor-pointer [&>path]:hover:stroke-neutral-950"
          onClick={onClose}
        />
      )}
    </div>
    <p className="text-neutral-500">{subheading}</p>
  </div>
)
