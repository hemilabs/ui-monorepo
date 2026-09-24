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

export const StatCard = ({
  badge,
  icon,
  isError,
  isLoading,
  label,
  value,
}: Props) => (
  <Card aria-busy={isLoading} shadow="sm">
    <div className="flex w-full flex-col gap-y-2 p-4">
      <div className="flex items-center gap-x-1.5">
        <span className="body-text-medium flex-1 text-neutral-500">
          {label}
        </span>
        {icon}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="text-2xl font-semibold leading-none text-neutral-950">
          {!isLoading && !isError ? (
            value
          ) : isError ? (
            '-'
          ) : (
            <Skeleton className="h-6 w-20" />
          )}
        </p>
        {!isError && (
          <span className="flex items-end empty:hidden [&>*]:flex [&>*]:items-end">
            {badge}
          </span>
        )}
      </div>
    </div>
  </Card>
)
