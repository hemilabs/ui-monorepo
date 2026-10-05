import { formatUnits } from 'viem'

type Payout = {
  payout: bigint
  timestamp: number
}

export type PayoutPoint = {
  afterUnlock: boolean
  x: number
  y: number
}

export const toPayoutSeries = ({
  decimals,
  lockEnd,
  payouts,
}: {
  decimals: number
  lockEnd: number
  payouts: Payout[]
}) =>
  payouts.map(({ payout, timestamp }) => ({
    afterUnlock: timestamp >= lockEnd,
    x: timestamp * 1000,
    y: Number(formatUnits(payout, decimals)),
  }))

export const getPayoutAxisTicks = function (series: PayoutPoint[]) {
  if (series.length === 0) {
    return []
  }

  const ticks = [
    series[0].x,
    series[Math.floor((series.length - 1) / 2)].x,
    series[series.length - 1].x,
  ]

  return [...new Set(ticks)]
}

export const getUnlockMarkerX = (series: PayoutPoint[]) =>
  series.find(point => point.afterUnlock)?.x
