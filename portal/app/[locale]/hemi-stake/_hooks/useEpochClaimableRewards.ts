import { queryOptions, useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { RewardSource, type ClaimableReward } from 'types/stakingDashboard'
import { getClaimableByToken } from 've-hemi-epoch-rewards/actions'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'

import { getClaimWindows } from '../_utils/claimableRewards'

import { useEpochSystemState } from './useEpochSystemState'

type HemiClient = ReturnType<typeof useHemiClient>
type EpochSystemState = NonNullable<
  ReturnType<typeof useEpochSystemState>['data']
>

export const getEpochClaimableRewardsQueryKeyPrefix = ({
  chainId,
  tokenId,
}: {
  chainId: number
  tokenId: bigint
}) => ['epochClaimableRewards', chainId, tokenId.toString()]

const getEpochClaimableRewardsQueryOptions = ({
  chainId,
  hemiClient,
  holder,
  systemState,
  tokenId,
}: {
  chainId: number
  hemiClient: HemiClient
  holder: Address | undefined
  systemState: EpochSystemState | undefined
  tokenId: bigint
}) =>
  queryOptions({
    enabled: !!holder && !!systemState && tokenId > BigInt(0),
    async queryFn() {
      const windows = getClaimWindows({
        fromEpoch: systemState!.firstFundableEpoch,
        maxClaimEpochs: Number(systemState!.maxClaimEpochs),
        maxClaimPairs: Number(systemState!.maxClaimPairs),
        toEpoch: systemState!.settledEpoch,
        tokenCount: systemState!.tokens.length,
      })

      return Promise.all(
        windows.map(async function ({ fromEpoch, toEpoch }) {
          const claims = await getClaimableByToken(hemiClient, {
            fromEpoch,
            holder: holder!,
            toEpoch,
            tokenId,
          })

          const rewards: ClaimableReward[] = claims.map(claim => ({
            amount: claim.claimable,
            decimals: claim.decimals,
            source: RewardSource.EPOCH,
            symbol: claim.symbol,
            token: claim.token,
          }))

          return { fromEpoch, rewards, toEpoch }
        }),
      )
    },
    queryKey: [
      ...getEpochClaimableRewardsQueryKeyPrefix({ chainId, tokenId }),
      holder,
      systemState?.settledEpoch,
    ],
    // The answer only moves when an epoch settles, which changes the key above, or when
    // this holder claims, which invalidates it.
    staleTime: 5 * 60 * 1000,
  })

export const useEpochClaimableRewards = function (tokenId: bigint) {
  const { address } = useAccount()
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const { data: systemState } = useEpochSystemState()

  return useQuery(
    getEpochClaimableRewardsQueryOptions({
      chainId,
      hemiClient,
      holder: address,
      systemState,
      tokenId,
    }),
  )
}
