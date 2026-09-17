import { Card } from 'components/card'
import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'

type Props = {
  badge?: ReactNode
  icon?: ReactNode
  isError: boolean
  isLoading: boolean
  label: ReactNode
  value: ReactNode
}

export const StatValueSkeleton = () => <Skeleton className="h-6 w-20" />

export const StakeStatCard = ({
  badge,
  icon,
  isError,
  isLoading,
  label,
  value,
}: Props) => (
  <Card aria-busy={isLoading} shadow="sm">
    <div className="flex w-full flex-col gap-y-2 p-4">
      <div className="flex items-center justify-between">
        <span className="body-text-medium text-neutral-500">{label}</span>
        {icon}
      </div>
      <p className="text-xl font-semibold text-neutral-950">
        {!isLoading && !isError ? value : isError ? '-' : <StatValueSkeleton />}
      </p>
      <div className="flex min-h-4 items-center">{badge}</div>
    </div>
  </Card>
)
