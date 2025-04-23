import Image from 'next/image'
import { ReactNode } from 'react'

import { ClockIcon } from './_icons/clockIcon'
import { OrangeCheckIcon } from './_icons/orangeCheckIcon'
import gradientLoadingImg from './_images/gradient_loading.png'
import { ProgressStatus } from './progressStatus'

type Props = {
  description: ReactNode
  status: ProgressStatus
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
              ? 'bg-orange-100 text-orange-500'
              : 'bg-neutral-300/50 text-neutral-500'
          }`}
        >
          {isProgress && (
            <Image
              alt="Loading indicator"
              className="object-contain"
              fill
              priority
              src={gradientLoadingImg}
            />
          )}
          <ClockIcon />
        </div>
      )}

      <span className={isProgress ? 'text-orange-500' : 'text-neutral-500'}>
        {description}
      </span>
    </div>
  )
}
