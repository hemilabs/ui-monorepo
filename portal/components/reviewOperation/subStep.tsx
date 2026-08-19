import { OrangeCheckIcon } from 'components/icons/orangeCheckIcon'
import { Image } from 'components/image'
import { ReactNode } from 'react'

import { ClockIcon } from './_icons/clockIcon'
import { gradientLoading } from './_images/gradientLoading'
import { ProgressStatus, type ProgressStatusType } from './progressStatus'

type Props = {
  description: ReactNode
  status: ProgressStatusType
}

export function SubStep({ description, status }: Props) {
  const isProgress = status === ProgressStatus.PROGRESS
  const isCompleted = status === ProgressStatus.COMPLETED

  return (
    <div className="flex items-center gap-x-3">
      {isCompleted ? (
        <OrangeCheckIcon />
      ) : (
        <div
          className={`relative flex h-5 w-5 items-center justify-center rounded-full ${
            isProgress
              ? 'bg-orange-100 text-orange-600'
              : 'bg-neutral-300/50 text-neutral-500'
          }`}
        >
          {isProgress && (
            <Image
              alt="Loading indicator"
              className="absolute inset-0 size-full animate-spin object-contain"
              loading="eager"
              src={gradientLoading.src}
            />
          )}
          <ClockIcon />
        </div>
      )}

      <span className={isProgress ? 'text-orange-600' : 'text-neutral-500'}>
        {description}
      </span>
    </div>
  )
}
