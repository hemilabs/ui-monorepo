import { formatUnits } from 'viem'

import { type ChartPoint } from './chartPoint'

type Payout = {
  payout: bigint
  timestamp: number
}

export type PayoutPoint = ChartPoint & {
  afterUnlock: boolean
}

const toAmount = (payout: bigint, decimals: number) =>
  Number(formatUnits(payout, decimals))

export const toPayoutSeries = ({
  decimals,
  lockEnd,
  payouts,
}: {
  decimals: number
  lockEnd: number | undefined
  payouts: Payout[]
}) =>
  payouts.map(({ payout, timestamp }) => ({
    afterUnlock: lockEnd !== undefined && timestamp >= lockEnd,
    x: timestamp * 1000,
    y: toAmount(payout, decimals),
  }))

export const toStackedPayoutSeries = function ({
  current,
  decimals,
  next,
}: {
  current: Payout[]
  decimals: number
  next: Payout[]
}) {
  const points = current.map(function ({ payout, timestamp }, index) {
    const other = next[index]?.payout ?? BigInt(0)
    const [lower, higher] = payout < other ? [payout, other] : [other, payout]
    const x = timestamp * 1000
    return {
      base: { afterUnlock: false, x, y: toAmount(lower, decimals) },
      delta: { afterUnlock: false, x, y: toAmount(higher - lower, decimals) },
    }
  })

  return {
    base: points.map(point => point.base),
    delta: points.map(point => point.delta),
  }
}

export const toZeroedSeries = (series: PayoutPoint[]) =>
  series.map(point => ({ ...point, afterUnlock: false, y: 0 }))

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
