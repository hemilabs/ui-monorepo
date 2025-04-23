import Image from 'next/image'

import { ErrorIcon } from './_icons/errorIcon'
import { OrangeCheckIcon } from './_icons/orangeCheckIcon'
import gradientLoadingImg from './_images/gradient_loading.png'
import { ProgressStatus } from './progressStatus'

type Props = {
  position: number
  status: ProgressStatus
}

export const PositionStatus = function ({ position, status }: Props) {
  if (status === ProgressStatus.COMPLETED) {
    return <OrangeCheckIcon />
  }
  if (status === ProgressStatus.FAILED) {
    return <ErrorIcon />
  }

  const isNotReady = status === ProgressStatus.NOT_READY
  const isInProgress = status === ProgressStatus.PROGRESS

  return (
    <div
      className={`relative h-5 w-5 rounded-full ${
        isNotReady ? 'bg-neutral-300/50' : 'bg-orange-100'
      }`}
    >
      {isInProgress && (
        <Image
          alt="Loading icon"
          className="animate-spin"
          src={gradientLoadingImg}
        />
      )}
      <div
        className={`absolute inset-0 flex items-center justify-center text-[11px] font-medium leading-none ${
          isNotReady ? 'text-neutral-500' : 'text-orange-500'
        }`}
      >
        {position}
      </div>
    </div>
  )
}
