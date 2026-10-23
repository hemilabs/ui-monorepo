import { type StakingPosition } from 'types/stakingDashboard'

import { getLockEnd } from './lockEpochs'

export const sortPositionsByUnlock = (positions: StakingPosition[]) =>
  positions
    .map(position => ({
      position,
      unlockTime: getLockEnd({
        effectiveLockEnd: position.effectiveLockEnd,
        lockTime: Number(position.lockTime),
        timestamp: Number(position.timestamp),
      }),
    }))
    .sort((left, right) => left.unlockTime - right.unlockTime)
    .map(({ position }) => position)
