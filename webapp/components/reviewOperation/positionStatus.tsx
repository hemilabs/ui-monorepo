import { ErrorIcon } from './_icons/errorIcon'
import { OrangeCheckIcon } from './_icons/orangeCheckIcon'
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
  return (
    <div
      className={`flex aspect-square h-5 items-center justify-center rounded-full ${
        status === ProgressStatus.NOT_READY
          ? 'bg-neutral-300/55 text-neutral-500'
          : 'bg-orange-500 text-white'
      }`}
    >
      <span className="flex-shrink-0 flex-grow-0 text-center lining-nums tabular-nums">
        {position}
      </span>
    </div>
  )
}
