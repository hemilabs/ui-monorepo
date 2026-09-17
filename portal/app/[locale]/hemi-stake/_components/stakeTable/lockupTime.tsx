import { DurationTime } from 'components/durationTime'

type Props = {
  lockupTime: bigint
}

export const LockupTime = ({ lockupTime }: Props) => (
  <span className="text-neutral-950">
    <DurationTime seconds={Number(lockupTime)} />
  </span>
)
