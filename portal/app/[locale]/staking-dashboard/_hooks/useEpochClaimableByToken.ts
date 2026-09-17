import { queryOptions, useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { getEpochRewardsLensAddress } from 'utils/veHemiEpochRewards'
import { getClaimableByToken, getSystemState } from 've-hemi-rewards/actions'
import type { Address } from 'viem'
import { useAccount } from 'wagmi'

import { useEpochSystemState } from './useEpochSystemState'

type HemiClient = ReturnType<typeof useHemiClient>
// The package returns this straight from `readContract`, so there is no hand-written
// type to import.
type SystemState = Awaited<ReturnType<typeof getSystemState>>

// The prefix a claim invalidates. The full key carries the settled epoch, which the
// caller has no reason to know, so invalidation matches on the prefix.
export const getEpochClaimableByTokenQueryKeyPrefix = ({
  chainId,
  tokenId,
}: {
  chainId: number
  tokenId: bigint
}) => ['epochClaimableByToken', chainId, tokenId.toString()]

const getEpochClaimableByTokenQueryKey = ({
  chainId,
  holder,
  settledEpoch,
  tokenId,
}: {
  chainId: number
  holder?: string
  settledEpoch?: number
  tokenId: bigint
}) => [
  ...getEpochClaimableByTokenQueryKeyPrefix({ chainId, tokenId }),
  holder,
  settledEpoch,
]

/**
 * The read behind one position's claimable figures, as options.
 *
 * The row asks for one position through `useQuery` and the dashboard's total asks for
 * all of them through `useQueries`. Sharing these keeps both on the same cache key, so
 * the page can't read the most expensive call twice or show a total that disagrees with
 * the rows under it.
 */
export const getEpochClaimableByTokenQueryOptions = ({
  chainId,
  hemiClient,
  holder,
  lensAddress,
  systemState,
  tokenId,
}: {
  chainId: number
  hemiClient: HemiClient
  holder: Address | undefined
  lensAddress: Address | undefined
  systemState: SystemState | undefined
  tokenId: bigint
}) =>
  queryOptions({
    enabled: !!holder && !!lensAddress && !!systemState,
    // A settled epoch changes every key on the page at once, and without this the whole
    // rewards column empties and re-reads in one burst.
    //
    // Held to the same position, though: the table reuses a row component for a different
    // tokenId when it re-sorts, and a blanket keepPreviousData would paint one position's
    // money under another's until the new read lands.
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === tokenId.toString() &&
      previousQuery?.queryKey[3] === holder
        ? previousData
        : undefined,
    queryFn: () =>
      getClaimableByToken(hemiClient, {
        fromEpoch: systemState!.firstFundableEpoch,
        holder: holder!,
        lensAddress: lensAddress!,
        toEpoch: systemState!.settledEpoch,
        tokenCount: systemState!.tokens.length,
        tokenId,
      }),
    queryKey: getEpochClaimableByTokenQueryKey({
      chainId,
      holder,
      settledEpoch: systemState?.settledEpoch,
      tokenId,
    }),
    // The answer only moves when an epoch settles, which changes the key above, or when
    // this holder claims, which invalidates explicitly. Nothing to poll for ~6 days.
    staleTime: 5 * 60 * 1000,
  })

/**
 * What the connected wallet can claim for one position, per reward asset.
 *
 * One query per position rather than per (position, asset): the Lens returns every
 * registered asset in a single read.
 *
 * Asks only about the connected wallet. A wallet can also be owed for positions it has
 * sold, but finding those is the past-owner work and not this hook.
 */
export const useEpochClaimableByToken = function (tokenId: bigint) {
  const { address } = useAccount()
  const { id: chainId } = useHemi()
  // Public client - reads need no signer, and this one has batching and the cache.
  const hemiClient = useHemiClient()
  const lensAddress = getEpochRewardsLensAddress(chainId)
  const { data: systemState } = useEpochSystemState()

  return useQuery(
    getEpochClaimableByTokenQueryOptions({
      chainId,
      hemiClient,
      holder: address,
      lensAddress,
      systemState,
      tokenId,
    }),
  )
}
