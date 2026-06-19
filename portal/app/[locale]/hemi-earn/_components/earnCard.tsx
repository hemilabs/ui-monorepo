'use client'

import { Card } from 'components/card'
import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'

type Props = {
  badge?: ReactNode
  icon: ReactNode
  isError: boolean
  isLoading: boolean
  label: string
  value: ReactNode
}

export const EarnCard = ({
  badge,
  icon,
  isError,
  isLoading,
  label,
  value,
}: Props) => (
  <Card shadow="sm">
    <div className="w-full p-4">
      <div className="flex flex-col gap-y-2">
        <div className="flex items-center justify-between">
          <span className="body-text-medium text-neutral-500">{label}</span>
          {icon}
        </div>
        <p className="text-2xl font-semibold text-neutral-950">
          {!isLoading && !isError ? (
            value
          ) : isError ? (
            '-'
          ) : (
            <Skeleton className="h-7 w-20" />
          )}
        </p>
        {!isLoading && !isError && badge && (
          <div className="self-start empty:hidden">{badge}</div>
        )}
      </div>
    </div>
  </Card>
)
