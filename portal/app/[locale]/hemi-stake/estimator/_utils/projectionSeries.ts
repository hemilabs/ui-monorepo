import { formatUnits } from 'viem'

import { toPayoutSeries } from '../../_utils/payoutsChartData'

export type ProjectionUnit = 'hemi' | 'usd'

type ProjectionEpoch = {
  payout: bigint
  timestamp: number
  weight: bigint
}

export const toPayoutBars = ({
  decimals,
  lockEnd,
  payouts,
  unit,
  usdPrice,
}: {
  decimals: number
  lockEnd: number
  payouts: ProjectionEpoch[]
  unit: ProjectionUnit
  usdPrice: number | undefined
}) =>
  toPayoutSeries({ decimals, lockEnd, payouts }).map(point => ({
    ...point,
    y: unit === 'usd' ? point.y * (usdPrice ?? 0) : point.y,
  }))

export const toVotingPowerCurve = ({
  decimals,
  lockEnd,
  payouts,
}: {
  decimals: number
  lockEnd: number
  payouts: ProjectionEpoch[]
}) =>
  payouts.map(({ timestamp, weight }) => ({
    afterUnlock: timestamp >= lockEnd,
    x: timestamp * 1000,
    y: Number(formatUnits(weight, decimals)),
  }))
