import Skeleton from 'react-loading-skeleton'
import { formatPercentage } from 'utils/format'

export type VetroFeeRowProps = {
  isError: boolean
  label: string
  percentage: number | undefined
}

export const VetroFeeRow = function ({
  isError,
  label,
  percentage,
}: VetroFeeRowProps) {
  const renderValue = function () {
    if (percentage !== undefined) {
      return (
        <span className="text-neutral-950">{formatPercentage(percentage)}</span>
      )
    }
    if (isError) {
      return <span className="text-neutral-950">-</span>
    }
    return <Skeleton className="w-12" />
  }

  return (
    <div className="flex items-center justify-between text-sm font-medium">
      <span className="text-neutral-500">{label}</span>
      {renderValue()}
    </div>
  )
}
