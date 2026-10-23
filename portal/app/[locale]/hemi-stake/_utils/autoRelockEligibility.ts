import { type StakingPosition } from 'types/stakingDashboard'
import { MinLockDurationSeconds, snapToEpoch } from 've-hemi-actions'

type CanEnableAutoRelock = Pick<
  StakingPosition,
  'effectiveLockEnd' | 'forfeitable' | 'transferable'
> & { now: number }

export const canEnableAutoRelock = ({
  effectiveLockEnd,
  forfeitable,
  now,
  transferable,
}: CanEnableAutoRelock) =>
  transferable &&
  !forfeitable &&
  effectiveLockEnd !== undefined &&
  effectiveLockEnd >= BigInt(snapToEpoch(now) + MinLockDurationSeconds)
