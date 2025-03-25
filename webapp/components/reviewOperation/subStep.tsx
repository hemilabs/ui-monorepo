import Skeleton from 'react-loading-skeleton'

import { ClockIcon } from './_icons/clockIcon'
import { OrangeCheckIcon } from './_icons/orangeCheckIcon'
import { ProgressStatus } from './progressStatus'

type Props = {
  description: string
  loading?: boolean
  status: ProgressStatus
}

export const SubStep = function ({
  description,
  loading = false,
  status,
}: Props) {
  const content = loading ? (
    <Skeleton className="h-full w-80" containerClassName="h-5" />
  ) : (
    <>
      {status === ProgressStatus.COMPLETED ? (
        <OrangeCheckIcon />
      ) : (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-300/55 p-0.5">
          <ClockIcon />
        </div>
      )}
      <span
        className={
          status === ProgressStatus.PROGRESS
            ? 'text-orange-500'
            : 'text-neutral-500'
        }
      >
        {description}
      </span>
    </>
  )

  return <div className="flex items-center gap-x-3">{content}</div>
}
