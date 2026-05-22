import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'

type Props = {
  children?: ReactNode
  isLoading?: boolean
  label: string
  value?: string
}

export const PoolInfoItem = function ({
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
      return <Skeleton height={17} width={80} />
    }
    return <span className="body-text-medium text-neutral-950">-</span>
  }

  return (
    <div className="flex flex-col gap-y-1">
      <span className="body-text-normal text-neutral-600">{label}</span>
      {renderValue()}
    </div>
  )
}
