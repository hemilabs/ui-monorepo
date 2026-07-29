import { getAssetData } from 'hemi-earn-actions/actions'
import {
  type Address,
  type PublicClient,
  createPublicClient,
  formatUnits,
  http,
  zeroAddress,
} from 'viem'
import { hemi } from 'viem/chains'

import {
  type GraphResponse,
  checkGraphQLErrors,
  paginateHemiEarnSubgraph,
  requestHemiEarn,
} from '../subgraphs/subgraph.ts'
import type { EarnCostBasis } from '../subgraphs/types/earn.ts'

import {
  type CostBasisEvent,
  type RatePoint,
  WAD_DECIMALS,
  replayCostBasis,
} from './replay.ts'

let hemiEarnRpcClient: PublicClient | undefined
const getHemiEarnRpcClient = function () {
  if (!hemiEarnRpcClient) {
    hemiEarnRpcClient = createPublicClient({
      chain: hemi,
      transport: http(undefined, { batch: true }),
    })
  }
  return hemiEarnRpcClient
}

// asset -> Hemi share OFT via the Router registry. Memoized because the mapping
// is immutable and there are only a handful of assets.
const shareByAssetCache = new Map<string, Promise<Address>>()
const resolveShareByAsset = function (asset: string) {
  const key = asset.toLowerCase()
  const cached = shareByAssetCache.get(key)
  if (cached) return cached
  const share = getAssetData(getHemiEarnRpcClient(), {
    asset: asset as Address,
  })
    .then(function (data) {
      const resolved = data.share.toLowerCase() as Address
      // A zero share means the asset isn't registered — fail loudly instead of
      // silently mis-keying the cost basis to the zero address.
      if (resolved === zeroAddress) {
        throw new Error(`getAssetData returned a zero share for asset ${asset}`)
      }
      return resolved
    })
    // Evict on failure so a transient RPC error (or the guard above) can't
    // poison the cache forever.
    .catch(function (error) {
      shareByAssetCache.delete(key)
      throw error
    })
  shareByAssetCache.set(key, share)
  return share
}

type RequestRow = {
  amountIn: string | null
  amountOut: string | null
  asset: string
  kind: 'DEPOSIT' | 'REDEEM'
  processedAt: string
  requestedAt: string | null
  stakedAmount: string | null
}

type ShareTransferRow = {
  from: string
  share: string
  timestamp: string
  to: string
  value: string
}

type RateSnapshotRow = {
  rateDenominator: string
  rateNumerator: string
  timestamp: string
}

const getRequests = ({ receiver }: { receiver: string }) =>
  paginateHemiEarnSubgraph<RequestRow>({
    async fetchPage({ limit, offset }) {
      const schema = {
        query: `query GetEarnCostBasis($limit: Int!, $offset: Int!, $receiver: String!) {
          Request(
            where: { receiver: { _eq: $receiver }, processedAt: { _is_null: false } }
            order_by: [{ processedAt: asc }, { requestId: asc }]
            limit: $limit
            offset: $offset
          ) {
            amountIn
            amountOut
            asset
            kind
            processedAt
            requestedAt
            stakedAmount
          }
        }`,
        variables: { limit, offset, receiver },
      }
      const response =
        await requestHemiEarn<GraphResponse<{ Request: RequestRow[] }>>(schema)
      checkGraphQLErrors(response)
      return response.data.Request
    },
  })

const getShareTransfers = ({ account }: { account: string }) =>
  paginateHemiEarnSubgraph<ShareTransferRow>({
    async fetchPage({ limit, offset }) {
      const schema = {
        query: `query GetShareTransfers($account: String!, $limit: Int!, $offset: Int!) {
          ShareTransfer(
            where: { _or: [{ from: { _eq: $account } }, { to: { _eq: $account } }] }
            order_by: [{ timestamp: asc }, { id: asc }]
            limit: $limit
            offset: $offset
          ) {
            from
            share
            timestamp
            to
            value
          }
        }`,
        variables: { account, limit, offset },
      }
      const response =
        await requestHemiEarn<
          GraphResponse<{ ShareTransfer: ShareTransferRow[] }>
        >(schema)
      checkGraphQLErrors(response)
      return response.data.ShareTransfer
    },
  })

const getEarnAssets = async function () {
  const schema = {
    query: `query GetEarnAssets {
      RateSnapshot(distinct_on: asset, order_by: { asset: asc }) { asset }
    }`,
  }
  const response =
    await requestHemiEarn<GraphResponse<{ RateSnapshot: { asset: string }[] }>>(
      schema,
    )
  checkGraphQLErrors(response)
  return response.data.RateSnapshot.map(row => row.asset.toLowerCase())
}

const fetchRateBound = async function ({
  asset,
  comparator,
  order,
  timestamp,
}: {
  asset: string
  comparator: '_gte' | '_lte'
  order: 'asc' | 'desc'
  timestamp: string
}) {
  const schema = {
    query: `query GetRateBound($asset: String!, $timestamp: numeric!) {
      RateSnapshot(
        where: { asset: { _eq: $asset }, timestamp: { ${comparator}: $timestamp } }
        order_by: { timestamp: ${order} }
        limit: 1
      ) {
        rateDenominator
        rateNumerator
        timestamp
      }
    }`,
    variables: { asset, timestamp },
  }
  const response =
    await requestHemiEarn<GraphResponse<{ RateSnapshot: RateSnapshotRow[] }>>(
      schema,
    )
  checkGraphQLErrors(response)
  return response.data.RateSnapshot[0] ?? null
}

const toRatePoint = (row: RateSnapshotRow): RatePoint => ({
  denominator: row.rateDenominator,
  numerator: row.rateNumerator,
})

// The RateSnapshot closest in time to `timestamp` (before or after), approximating
// the on-chain convertToAssets at the transfer moment.
const getNearestRate = async function ({
  asset,
  timestamp,
}: {
  asset: string
  timestamp: string
}): Promise<RatePoint | null> {
  const [below, above] = await Promise.all([
    fetchRateBound({ asset, comparator: '_lte', order: 'desc', timestamp }),
    fetchRateBound({ asset, comparator: '_gte', order: 'asc', timestamp }),
  ])
  if (!below) return above ? toRatePoint(above) : null
  if (!above) return toRatePoint(below)
  const target = BigInt(timestamp)
  const closest =
    target - BigInt(below.timestamp) <= BigInt(above.timestamp) - target
      ? below
      : above
  return toRatePoint(closest)
}

type TimedEvent = { event: CostBasisEvent; timestamp: bigint }

const requestToEvent = function (
  row: RequestRow,
  shareByAsset: Record<string, Address>,
): TimedEvent | null {
  const share = shareByAsset[row.asset.toLowerCase()]
  if (!share) return null
  const timestamp = BigInt(row.requestedAt ?? row.processedAt)
  if (row.kind === 'DEPOSIT') {
    if (row.amountOut === null) return null
    return {
      event: {
        kind: 'DEPOSIT',
        share,
        shares: row.amountOut,
        staked: row.stakedAmount,
      },
      timestamp,
    }
  }
  if (row.amountIn === null) return null
  return { event: { kind: 'REDEEM', share, shares: row.amountIn }, timestamp }
}

const transferToEvent = async function (
  row: ShareTransferRow,
  account: string,
  assetByShare: Record<string, string>,
): Promise<TimedEvent | null> {
  const from = row.from.toLowerCase()
  const share = row.share.toLowerCase()
  const to = row.to.toLowerCase()
  const timestamp = BigInt(row.timestamp)
  if (to === account && from !== account) {
    const asset = assetByShare[share]
    const rate = asset
      ? await getNearestRate({ asset, timestamp: row.timestamp })
      : null
    return {
      event: { kind: 'TRANSFER_IN', rate, share, value: row.value },
      timestamp,
    }
  }
  if (from === account && to !== account) {
    return {
      event: { kind: 'TRANSFER_OUT', share, value: row.value },
      timestamp,
    }
  }
  return null
}

// Per-share cost basis, replayed from the user's processed deposits/redeems and
// peer-to-peer share transfers in chronological order: transfers in are priced at
// the nearest share->asset rate (FMV), disposals reduce the basis proportionally.
// Filtered by `receiver` (the holder), not `initiator`. Keyed by the Hemi share
// OFT; the value is a decimal string, fractional after proportional reductions.
export const getEarnCostBasis = async function ({
  address,
}: {
  address: Address
}): Promise<EarnCostBasis> {
  const account = address.toLowerCase()

  const [requestRows, transferRows] = await Promise.all([
    getRequests({ receiver: account }),
    getShareTransfers({ account }),
  ])

  // The user's request assets always resolve (they deposited through the Router).
  // Global assets are only needed to map a transfer's share back to an asset for
  // pricing, so skip that enumeration (and its RPC calls) when there are no
  // transfers. Resolution is defensive: one de-registered asset must not fail the
  // whole request.
  const requestAssets = requestRows.map(row => row.asset.toLowerCase())
  const globalAssets = transferRows.length > 0 ? await getEarnAssets() : []
  const resolved = await Promise.all(
    [...new Set([...requestAssets, ...globalAssets])].map(asset =>
      resolveShareByAsset(asset).then(
        share => [asset, share] as const,
        () => null,
      ),
    ),
  )
  const shareByAsset: Record<string, Address> = Object.fromEntries(
    resolved.filter(
      (entry): entry is readonly [string, Address] => entry !== null,
    ),
  )
  const assetByShare: Record<string, string> = Object.fromEntries(
    Object.entries(shareByAsset).map(([asset, share]) => [share, asset]),
  )

  const timed = (
    await Promise.all([
      ...requestRows.map(row => requestToEvent(row, shareByAsset)),
      ...transferRows.map(row => transferToEvent(row, account, assetByShare)),
    ])
  ).filter((entry): entry is TimedEvent => entry !== null)

  timed.sort((a, b) =>
    a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0,
  )

  const positions = replayCostBasis(timed.map(entry => entry.event))

  return Object.fromEntries(
    [...positions].map(([share, { costBasis }]) => [
      share,
      formatUnits(costBasis, WAD_DECIMALS),
    ]),
  )
}
