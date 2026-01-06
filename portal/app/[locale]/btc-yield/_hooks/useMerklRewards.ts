import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { getUserRewards, type MerklRewards } from 'utils/merkl'
import { type Hex } from 'viem'
import { hemi as hemiMainnet } from 'viem/chains'
import { useAccount } from 'wagmi'

import { useMerklCampaigns } from './useMerklCampaigns'

export const getMerklRewardsQueryKey = ({
  address,
  campaignIds = [],
}: {
  address: string | undefined
  campaignIds: Hex[] | undefined
}) => ['merkl-rewards', address, ...campaignIds]

export const useMerklRewards = function <TData = MerklRewards>({
  select,
}: {
  select?: (data: MerklRewards) => TData
} = {}) {
  const { address } = useAccount()
  const hemi = useHemi()

  const { data: merklData } = useMerklCampaigns()
  const campaignIds = merklData?.campaigns.map(c => c.campaignId)

  return useQuery({
    // rewards only work for mainnet
    enabled:
      hemi.id === hemiMainnet.id &&
      address !== undefined &&
      campaignIds !== undefined,
    async queryFn() {
      const allRewards = await getUserRewards({
        address: address!,
        chainId: hemi.id,
      })
      return allRewards
        .flatMap(({ rewards }) => rewards)
        .filter(reward =>
          reward.breakdowns.some(breakdown =>
            campaignIds!.includes(breakdown.campaignId),
          ),
        )
    },
    queryKey: getMerklRewardsQueryKey({ address, campaignIds }),
    select,
  })
}
