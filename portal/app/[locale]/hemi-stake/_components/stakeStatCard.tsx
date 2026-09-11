import { Card } from 'components/card'
import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'

type Props = {
  badge?: ReactNode
  isError: boolean
  isLoading: boolean
  label: string
  value: ReactNode
}

export const StatValueSkeleton = () => <Skeleton className="h-6 w-20" />

export const StakeStatCard = ({
  badge,
  isError,
  isLoading,
  label,
  value,
}: Props) => (
  <Card aria-busy={isLoading} shadow="sm">
    <div className="flex w-full flex-col gap-y-2 p-4">
      <span className="body-text-medium text-neutral-500">{label}</span>
      <p className="text-xl font-semibold text-neutral-950">
        {!isLoading && !isError ? value : isError ? '-' : <StatValueSkeleton />}
      </p>
      <div className="flex min-h-4 items-center">
        {isLoading && badge !== undefined ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          badge
        )}
      </div>
    </div>
  </Card>
)
