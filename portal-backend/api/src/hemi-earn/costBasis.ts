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

import { type CostBasisRow, WAD_DECIMALS, replayCostBasis } from './replay.ts'

// Lazily created and reused across cost-basis lookups so the Hemi client is only
// built when the endpoint is hit. Chain-default RPC with batching, matching how
// the ve-hemi module consumes its package actions.
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
        throw new Error(`assetsData returned no share for asset ${asset}`)
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

type GetEarnCostBasisQueryResponse = GraphResponse<{ Request: CostBasisRow[] }>

/**
 * Computes a user's per-vault Hemi Earn cost basis by replaying their processed
 * requests. Filtered by `receiver` (the holder of the shares) — unlike
 * `getEarnRequests`, which follows `initiator` — because the earned card values
 * what the user holds. Keyed by the Hemi share OFT (== the portal shareAddress),
 * value in pegged base units (decimal string).
 *
 * Known limitation: only Router deposits/redeems are replayed, so peer-to-peer
 * share-OFT transfers are not tracked — shares acquired outside a deposit read
 * as pure profit. The normal deposit→receiver flow is fully covered.
 */
export const getEarnCostBasis = async function ({
  address,
}: {
  address: Address
}): Promise<EarnCostBasis> {
  const receiver = address.toLowerCase()

  const rows = await paginateHemiEarnSubgraph<CostBasisRow>({
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
            stakedAmount
          }
        }`,
        variables: { limit, offset, receiver },
      }

      const response =
        await requestHemiEarn<GetEarnCostBasisQueryResponse>(schema)
      checkGraphQLErrors(response)
      return response.data.Request
    },
  })

  const assets = [...new Set(rows.map(row => row.asset.toLowerCase()))]
  const shareByAsset: Record<string, Address> = Object.fromEntries(
    await Promise.all(
      assets.map(async asset => [asset, await resolveShareByAsset(asset)]),
    ),
  )

  const positions = replayCostBasis(rows, shareByAsset)

  return Object.fromEntries(
    [...positions].map(([share, { costBasis }]) => [
      share,
      formatUnits(costBasis, WAD_DECIMALS),
    ]),
  )
}
