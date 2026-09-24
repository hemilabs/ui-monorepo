import { formatUnits } from 'viem'

export type SupplyPoint = {
  circulating: string
  date: string
  nonCirculating: string
  priceUsd: string | null
  staked: string
  totalSupply: string
}

export type SupplyPeriod = '1w' | '1m' | '3m'

export type SupplyUnit = 'hemi' | 'usd'

export type SupplySlice = 'circulating' | 'nonCirculating' | 'staked'

export type ParsedSupplyPoint = Record<SupplySlice, number> & {
  priceUsd: number | null
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
  const day = date.slice(0, 10)
  const parsed = new Date(`${day}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || !parsed.toISOString().startsWith(day)) {
    throw new Error(`Unexpected supply history date: ${date}`)
  }
  return parsed.getTime()
}

const toFiniteNumber = function (value: string, field: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Unexpected supply history ${field}: ${value}`)
  }
  return parsed
}

const toPrice = function (value: string | null | undefined) {
  const price = value ?? null
  return price === null ? null : toFiniteNumber(price, 'price')
}

const toTokens = (wei: string, decimals: number) =>
  toFiniteNumber(formatUnits(BigInt(wei), decimals), 'amount')

// Throws on malformed values on purpose: it runs where the query can turn it
// into an error state, rather than during render.
// Sorted here so the rest of the pipeline can read the ends of the range off
// at(0)/at(-1): the endpoint does not promise an order.
export const parseSupplyPoints = (points: SupplyPoint[], decimals: number) =>
  points
    .map(point => ({
      circulating: toTokens(point.circulating, decimals),
      nonCirculating: toTokens(point.nonCirculating, decimals),
      priceUsd: toPrice(point.priceUsd),
      staked: toTokens(point.staked, decimals),
      timestamp: toTimestamp(point.date),
      totalSupply: toTokens(point.totalSupply, decimals),
    }))
    .sort((a, b) => a.timestamp - b.timestamp)

const hasPrices = (points: ParsedSupplyPoint[]) =>
  points.every(point => point.priceUsd !== null)

const canRender = (points: ParsedSupplyPoint[], unit: SupplyUnit) =>
  unit === 'hemi' || hasPrices(points)

const toValue = ({
  point,
  slice,
  unit,
}: {
  point: ParsedSupplyPoint
  slice: SupplySlice
  unit: SupplyUnit
}) => (unit === 'usd' ? point[slice] * (point.priceUsd ?? 0) : point[slice])

export const toChartSeries = function ({
  points,
  unit,
}: {
  points: ParsedSupplyPoint[]
  unit: SupplyUnit
}) {
  if (!canRender(points, unit)) {
    return undefined
  }

  return Object.fromEntries(
    supplySlices.map(slice => [
      slice,
      points.map(point => ({
        x: point.timestamp,
        y: toValue({ point, slice, unit }),
      })),
    ]),
  ) as Record<SupplySlice, ChartPoint[]>
}

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

  if (first === undefined || last === undefined || !canRender(points, unit)) {
    return undefined
  }

  return Object.fromEntries(
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
}
