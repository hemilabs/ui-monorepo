import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'

type Props = {
  children?: ReactNode
  isLoading?: boolean
  label: ReactNode
  value?: string
}

export const VaultInfoItem = function ({
  children,
  isLoading,
  label,
  value,
}: Props) {
  const renderValue = function () {
    if (children) {
      return children
    }
    if (value !== undefined) {
      return <span className="body-text-medium text-neutral-950">{value}</span>
    }
    if (isLoading) {
      return (
        <Skeleton
          containerClassName="block leading-none"
          height={18}
          width={80}
        />
      )
    }
    return <span className="body-text-medium text-neutral-950">-</span>
  }

  return (
    <div className="flex flex-col gap-y-1">
      <div className="body-text-normal flex items-center gap-x-1 text-neutral-600">
        {label}
      </div>
      {renderValue()}
    </div>
  )
}
