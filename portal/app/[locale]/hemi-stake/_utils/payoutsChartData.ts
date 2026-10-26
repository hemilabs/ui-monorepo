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

export const getPayoutAxisTicks = function (series: PayoutPoint[], count = 3) {
  if (series.length === 0) {
    return []
  }

  if (count < 2) {
    return [series[0].x]
  }

  const last = series.length - 1
  const ticks = Array.from(
    { length: count },
    (_, index) => series[Math.floor((index * last) / (count - 1))].x,
  )

  return [...new Set(ticks)]
}

export const getUnlockMarkerX = (series: PayoutPoint[]) =>
  series.find(point => point.afterUnlock)?.x
