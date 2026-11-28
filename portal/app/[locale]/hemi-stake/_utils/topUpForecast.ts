import { secondsToWholeDays } from 'utils/time'
import { snapToEpoch } from 've-hemi-actions'

import { getBlendedForecast } from './blendedForecast'
import { getEpochEnd } from './lockEpochs'
import { type InputsByClass, type PositionClass } from './rewardClass'

type TopUpPosition = {
  amount: bigint
  lockEnd: number
  positionClass: PositionClass
}

export const earnsAnotherEpoch = ({
  lockEnd,
  now,
}: {
  lockEnd: number
  now: number
}) => snapToEpoch(lockEnd) > getEpochEnd({ epochsAhead: 0, now })

export const getTopUpForecast = function ({
  addedAmount,
  inputsByClass,
  now,
  position,
}: {
  addedAmount: bigint
  inputsByClass: InputsByClass
  now: number
  position: TopUpPosition
}) {
  const lockEnd = snapToEpoch(position.lockEnd)

  const { blended, existing, incoming } = getBlendedForecast({
    existing: [{ ...position, lockEnd }],
    incoming: {
      amount: addedAmount,
      lockDurationInSeconds: lockEnd - now,
      positionClass: position.positionClass,
    },
    inputsByClass,
    now,
  })

  return {
    blended,
    daysUntilUnlock: secondsToWholeDays(lockEnd - now),
    existing,
    incoming,
    nextPayout: existing.payouts[0].payout + incoming.payouts[0].payout,
    paysInFirstYear:
      existing.yearOneTotal > BigInt(0) || incoming.yearOneTotal > BigInt(0),
    totalAmount: position.amount + addedAmount,
  }
}
