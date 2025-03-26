import { ReactNode } from 'react'

import { ClockIcon } from './_icons/clockIcon'
import { OrangeCheckIcon } from './_icons/orangeCheckIcon'
import { ProgressStatus } from './progressStatus'

type Props = {
  description: ReactNode
  status: ProgressStatus
}

export const SubStep = ({ description, status }: Props) => (
  <div className="flex items-center gap-x-3">
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
  </div>
)
