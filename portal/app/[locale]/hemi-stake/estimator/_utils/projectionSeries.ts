import { formatUnits } from 'viem'

import { type ChartUnit } from '../../_utils/chartUnit'
import { toPayoutSeries } from '../../_utils/payoutsChartData'

export type ProjectionEpoch = {
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
  unit: ChartUnit
  usdPrice: number | undefined
}) =>
  toPayoutSeries({ decimals, lockEnd, payouts }).map(point => ({
    ...point,
    y: unit === 'usd' ? point.y * (usdPrice ?? 0) : point.y,
  }))

export const toVotingPowerCurve = ({
  decimals,
  payouts,
}: {
  decimals: number
  payouts: ProjectionEpoch[]
}) =>
  payouts.map(({ timestamp, weight }) => ({
    x: timestamp * 1000,
    y: Number(formatUnits(weight, decimals)),
  }))
