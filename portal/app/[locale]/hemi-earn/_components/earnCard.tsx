'use client'

import { Card } from 'components/card'
import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'

type Props = {
  icon: ReactNode
  isError: boolean
  isLoading: boolean
  label: string
  subtitle: ReactNode
  tooltipContent: ReactNode
  value: ReactNode
}

export const EarnCard = ({
  icon,
  isError,
  isLoading,
  label,
  subtitle,
  tooltipContent,
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
        <div className="flex items-center gap-x-1">
          <span className="body-text-medium text-neutral-500">
            {!isLoading && !isError ? (
              subtitle
            ) : isError ? (
              '-'
            ) : (
              <Skeleton className="h-4 w-24" />
            )}
          </span>
          {!isLoading && !isError && (
            <Tooltip
              borderRadius="6px"
              disabled={!tooltipContent}
              text={tooltipContent}
              variant="simple"
            >
              <span className="group cursor-pointer">
                <InfoIcon className="size-4 [&_path]:fill-neutral-400 [&_path]:transition-colors [&_path]:duration-300 group-hover:[&_path]:fill-neutral-950" />
              </span>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  </Card>
)
