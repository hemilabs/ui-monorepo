import { formatUnits } from 'viem'

export type SupplyPoint = {
  circulating: string
  date: string
  nonCirculating: string
  priceUsd: string
  staked: string
  totalSupply: string
}

export type SupplyPeriod = '1w' | '1m' | '3m'

export type SupplyUnit = 'hemi' | 'usd'

export type SupplySlice = 'circulating' | 'nonCirculating' | 'staked'

export type ParsedSupplyPoint = Record<SupplySlice, number> & {
  priceUsd: number
  timestamp: number
  totalSupply: number
}

export type ChartPoint = {
  x: number
  y: number
}

// legend order, top of the stack first
export const supplySlices: SupplySlice[] = [
  'nonCirculating',
  'staked',
  'circulating',
]

export const stackOrder = [...supplySlices].reverse()

export const sliceLabels = {
  circulating: 'circulating',
  nonCirculating: 'non-circulating',
  staked: 'staked',
} as const

const daysPerPeriod: Record<SupplyPeriod, number> = {
  '1m': 30,
  '1w': 7,
  '3m': 90,
}

const oneDayMs = 24 * 60 * 60 * 1000

export const getPeriodDurationMs = (period: SupplyPeriod) =>
  (daysPerPeriod[period] - 1) * oneDayMs

// The endpoint dates a point by the day it covers, but a full ISO timestamp
// would parse just as well, so only the date half is read.
const toTimestamp = function (date: string) {
  const timestamp = new Date(`${date.slice(0, 10)}T00:00:00Z`).getTime()
  if (Number.isNaN(timestamp)) {
    throw new Error(`Unexpected supply history date: ${date}`)
  }
  return timestamp
}

const toTokens = (wei: string, decimals: number) =>
  Number(formatUnits(BigInt(wei), decimals))

// Throws on malformed values on purpose: it runs where the query can turn it
// into an error state, rather than during render.
export const parseSupplyPoints = (points: SupplyPoint[], decimals: number) =>
  points.map(point => ({
    circulating: toTokens(point.circulating, decimals),
    nonCirculating: toTokens(point.nonCirculating, decimals),
    priceUsd: Number(point.priceUsd),
    staked: toTokens(point.staked, decimals),
    timestamp: toTimestamp(point.date),
    totalSupply: toTokens(point.totalSupply, decimals),
  }))

const toValue = ({
  point,
  slice,
  unit,
}: {
  point: ParsedSupplyPoint
  slice: SupplySlice
  unit: SupplyUnit
}) => (unit === 'usd' ? point[slice] * point.priceUsd : point[slice])

export const sliceByPeriod = function (
  points: ParsedSupplyPoint[],
  period: SupplyPeriod,
) {
  const last = points.at(-1)
  if (last === undefined) {
    return points
  }
  const from = last.timestamp - getPeriodDurationMs(period)
  return points.filter(point => point.timestamp >= from)
}

export const toChartSeries = ({
  points,
  unit,
}: {
  points: ParsedSupplyPoint[]
  unit: SupplyUnit
}) =>
  Object.fromEntries(
    supplySlices.map(slice => [
      slice,
      points.map(point => ({
        x: point.timestamp,
        y: toValue({ point, slice, unit }),
      })),
    ]),
  ) as Record<SupplySlice, ChartPoint[]>

type SliceSummary = {
  change: number
  share: number
  value: number
}

export const getSupplySummary = function ({
  points,
  unit,
}: {
  points: ParsedSupplyPoint[]
  unit: SupplyUnit
}) {
  const first = points.at(0)
  const last = points.at(-1)

  if (first === undefined || last === undefined) {
    return undefined
  }

  const slices = Object.fromEntries(
    supplySlices.map(slice => [
      slice,
      {
        change:
          toValue({ point: last, slice, unit }) -
          toValue({ point: first, slice, unit }),
        share: last.totalSupply === 0 ? 0 : last[slice] / last.totalSupply,
        value: toValue({ point: last, slice, unit }),
      },
    ]),
  ) as Record<SupplySlice, SliceSummary>

  return {
    ...slices,
    price: {
      change:
        first.priceUsd === 0
          ? 0
          : (last.priceUsd - first.priceUsd) / first.priceUsd,
      value: last.priceUsd,
    },
  }
}
