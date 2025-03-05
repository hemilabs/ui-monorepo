import { WarningIcon } from 'components/icons/warningIcon'
import { ComponentProps, ReactNode } from 'react'
import { CloseIcon } from 'ui-common/components/closeIcon'

type Props = {
  children?: ReactNode
  heading: string
  icon?: React.ComponentType<ComponentProps<'svg'>>
  // Use react Node to allow rich translated components
  subheading: ReactNode
  onClose?: () => void
}

export const WarningBox = ({
  children,
  heading,
  icon: Icon = WarningIcon,
  onClose,
  subheading,
}: Props) => (
  <div className="flex flex-col gap-y-1 rounded-lg bg-neutral-50 p-4 text-sm font-medium">
    <div className="flex items-center gap-x-1">
      <Icon />
      <p className="text-neutral-900">{heading}</p>
      {!!onClose && (
        <CloseIcon
          className="cursor-pointer [&>path]:hover:stroke-neutral-950"
          onClick={onClose}
        />
      )}
    </div>
    <p className="text-neutral-500">{subheading}</p>
    {children}
  </div>
)
