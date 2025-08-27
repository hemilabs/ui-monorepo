import { DurationTime } from 'components/durationTime'

type Props = {
  lockupTime: bigint
}

export const LockupTime = function ({ lockupTime }: Props) {
  const seconds = Number(lockupTime)

  return (
    <span className="text-neutral-500">
      <DurationTime seconds={seconds} />
    </span>
  )
}
