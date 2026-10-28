import { CloseIcon } from 'components/icons/closeIcon'
import { WarningIcon } from 'components/icons/warningIcon'
import { ComponentProps, ReactNode } from 'react'

type Props = {
  children?: ReactNode
  heading?: string
  icon?: React.ComponentType<ComponentProps<'svg'>>
  onClose?: VoidFunction
  // Use react Node to allow rich translated components
  subheading: ReactNode
}

export const WarningBox = function ({
  children,
  heading,
  icon: Icon = WarningIcon,
  onClose,
  subheading,
}: Props) {
  const close = !!onClose && (
    <CloseIcon
      className="h-5 w-5 shrink-0 cursor-pointer [&>path]:hover:stroke-neutral-950"
      onClick={onClose}
    />
  )

  return (
    <div className="flex flex-col gap-y-1 rounded-lg bg-neutral-50 p-4 text-sm font-medium">
      {heading ? (
        <>
          <div className="flex items-center gap-x-1">
            <Icon />
            <p className="text-neutral-900">{heading}</p>
            {close}
          </div>
          <p className="text-neutral-500">{subheading}</p>
        </>
      ) : (
        <div className="flex items-start gap-x-1">
          <span className="flex h-4.5 shrink-0 items-center">
            <Icon />
          </span>
          <p className="text-neutral-500">{subheading}</p>
          {close}
        </div>
      )}
      {children}
    </div>
  )
}
