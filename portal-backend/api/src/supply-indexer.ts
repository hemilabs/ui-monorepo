import { dayMs, startOfDay, toDate } from './dates.ts'
import { BadRequestError } from './errors.ts'
import { type Cache } from './redis.ts'
import { UpstreamGraphQLError } from './subgraphs/errors.ts'
import {
  type GraphResponse,
  checkGraphQLErrors,
  requestHemiEarn,
} from './subgraphs/subgraph.ts'

export type SupplyIndexerOptions = {
  cache: Cache
  correction: string
  merkleLocked: number
}

type SupplyRow = {
  bnbBlock: number | null
  bnbSafe: string | null
  burned: string | null
  date: string
  ethBlock: number | null
  ethSafe: string | null
  hemiBlock: number | null
  hemiSafe: string | null
  locked: string | null
  merkle: string | null
  opBalances: string | null
  totalSupply: string | null
}

/* eslint-disable sort-keys */
const periodDays: Record<string, number> = {
  '1w': 7,
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
}
/* eslint-enable sort-keys */

export const isSupplyPeriod = (period: string) =>
  Object.hasOwn(periodDays, period)

const fields = `
  bnbBlock
  bnbSafe
  burned
  date
  ethBlock
  ethSafe
  hemiBlock
  hemiSafe
  locked
  merkle
  opBalances
  totalSupply`

const toBigInt = (value: string | null) => (value ? BigInt(value) : 0n)

const fromUnit = function (value: string) {
  const negative = value.startsWith('-')
  const digits = (negative ? value.slice(1) : value).padStart(19, '0')
  return `${negative ? '-' : ''}${digits.slice(0, -18)}.${digits.slice(-18)}`
}

function createSupplyIndexer({
  cache,
  correction,
  merkleLocked,
}: SupplyIndexerOptions) {
  async function query<T>(
    graphQuery: string,
    variables?: Record<string, string>,
  ) {
    const response = await requestHemiEarn<GraphResponse<T>>({
      query: graphQuery,
      variables,
    })
    checkGraphQLErrors(response)
    return response.data
  }

  function toAmounts(row: SupplyRow) {
    const nonCirculating =
      BigInt(correction) +
      toBigInt(row.bnbSafe) +
      toBigInt(row.burned) +
      toBigInt(row.ethSafe) +
      toBigInt(row.hemiSafe) +
      (toBigInt(row.merkle) * BigInt(merkleLocked)) / 100n +
      toBigInt(row.opBalances)
    const staked = toBigInt(row.locked)
    const totalSupply = toBigInt(row.totalSupply)
    return {
      circulating: totalSupply - staked - nonCirculating,
      nonCirculating,
      staked,
      totalSupply,
    }
  }

  async function getCirculatingSupply() {
    const data = await query<{ DailySupplySnapshot: SupplyRow[] }>(
      `query GetLatestSupplySnapshots {
        DailySupplySnapshot(
          where: {
            bnbBlock: { _is_null: false }
            ethBlock: { _is_null: false }
            hemiBlock: { _is_null: false }
          }
          order_by: { date: desc }
          limit: 1
        ) {${fields}
        }
      }`,
    )
    const [row] = data.DailySupplySnapshot
    if (!row) {
      throw new UpstreamGraphQLError(
        'the supply indexer has not read every chain yet',
      )
    }
    return fromUnit(toAmounts(row).circulating.toString())
  }

  async function getSupplyHistory(period: string) {
    if (!isSupplyPeriod(period)) {
      throw new BadRequestError(`${period} is not a supply history period`)
    }
    const days = periodDays[period]
    const lastDate = toDate(Date.now() - dayMs)
    const firstDate = toDate(startOfDay(lastDate) - (days - 1) * dayMs)
    const [data, prices] = await Promise.all([
      query<{ DailySupplySnapshot: SupplyRow[] }>(
        `query GetDailySupplySnapshots($firstDate: String!, $lastDate: String!) {
          DailySupplySnapshot(
            where: {
              bnbBlock: { _is_null: false }
              date: { _gte: $firstDate, _lte: $lastDate }
              ethBlock: { _is_null: false }
              hemiBlock: { _is_null: false }
            }
            order_by: { date: asc }
          ) {${fields}
          }
        }`,
        { firstDate, lastDate },
      ),
      cache.getPriceHistory('HEMI').catch(function (error) {
        console.warn('Failed to read the HEMI prices:', error)
        return null
      }),
    ])
    return data.DailySupplySnapshot.map(function (row) {
      const amounts = toAmounts(row)
      return {
        circulating: amounts.circulating.toString(),
        date: row.date,
        nonCirculating: amounts.nonCirculating.toString(),
        priceUsd: prices?.[row.date] ?? null,
        staked: amounts.staked.toString(),
        totalSupply: amounts.totalSupply.toString(),
      }
    })
  }

  return { getCirculatingSupply, getSupplyHistory }
}

export { createSupplyIndexer }
