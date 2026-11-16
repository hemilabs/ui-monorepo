import { toFraction } from 'utils/bigint'
import { secondsToWholeDays } from 'utils/time'
import { snapToEpoch } from 've-hemi-actions'

import { getBlendedForecast } from './blendedForecast'
import { daysToSeconds } from './lockCreationTimes'
import { capAtMaxLock, getLockEnd } from './lockEpochs'
import { type InputsByClass, type PositionClass } from './rewardClass'

type ExtendedPosition = {
  amount: bigint
  lockEnd: number
  positionClass: PositionClass
}

const noIncoming = { amount: BigInt(0), lockDurationInSeconds: 0 }

const sumPayouts = (payouts: { payout: bigint }[]) =>
  payouts.reduce((total, { payout }) => total + payout, BigInt(0))

export const getExtendedLockEnd = ({
  lockupDays,
  now,
}: {
  lockupDays: number
  now: number
}) =>
  getLockEnd({
    lockTime: capAtMaxLock(daysToSeconds(lockupDays)),
    timestamp: now,
  })

export const getExtendForecast = function ({
  extendedLockEnd,
  inputsByClass,
  now,
  position,
}: {
  extendedLockEnd: number
  inputsByClass: InputsByClass
  now: number
  position: ExtendedPosition
}) {
  const settledLockEnd = snapToEpoch(position.lockEnd)
  const lockEnd = Math.max(extendedLockEnd, settledLockEnd)

  const forecastUntil = (until: number) =>
    getBlendedForecast({
      existing: [{ ...position, lockEnd: until, settledLockEnd }],
      incoming: noIncoming,
      inputsByClass,
      now,
    }).existing

  const current = forecastUntil(settledLockEnd)
  const extended = forecastUntil(lockEnd)

  const addedPayouts = extended.payouts.map((epoch, index) => ({
    ...epoch,
    payout: epoch.payout - current.payouts[index].payout,
    weight: epoch.weight - current.payouts[index].weight,
  }))
  const addedTotal = sumPayouts(addedPayouts)

  return {
    blended: {
      lockEnd,
      yearOneReturnRatio: toFraction(extended.yearOneTotal, position.amount),
      yearOneTotal: extended.yearOneTotal,
    },
    daysUntilUnlock: secondsToWholeDays(lockEnd - now),
    existing: current,
    incoming: {
      payouts: addedPayouts,
      yearOneReturnRatio: toFraction(addedTotal, position.amount),
      yearOneTotal: addedTotal,
    },
    nextPayout: extended.payouts[0].payout,
    paysInFirstYear: extended.yearOneTotal > BigInt(0),
    totalAmount: position.amount,
  }
}
