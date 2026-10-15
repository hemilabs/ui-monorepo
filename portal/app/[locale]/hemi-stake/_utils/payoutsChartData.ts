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
