import { useQuery } from '@tanstack/react-query'
import { useHemiClient } from 'hooks/useHemiClient'
import { getClaimable } from 'vault-rewards-actions/actions'
import { type Chain } from 'viem'
import { useAccount } from 'wagmi'

import { PoolRewards } from '../_types'

import { useVaultRewardsAddress } from './useVaultRewardsAddress'

export const getPoolRewardsQueryKey = (
  chainId: Chain['id'] | undefined,
  address: string | undefined,
) => ['pool-rewards', 'claimable', chainId, address]

export const usePoolRewards = function <TData = PoolRewards>({
  select,
}: {
  select?: (data: PoolRewards) => TData
} = {}) {
  const { address } = useAccount()
  const hemiClient = useHemiClient()
  const { data: vaultRewardsAddress } = useVaultRewardsAddress()

  return useQuery({
    enabled: address !== undefined && vaultRewardsAddress !== undefined,
    async queryFn() {
      if (vaultRewardsAddress === undefined) {
        return [] as PoolRewards
      }
      return getClaimable(hemiClient, {
        account: address!,
        vaultRewardsAddress: vaultRewardsAddress!,
      }) as Promise<PoolRewards>
    },
    queryKey: getPoolRewardsQueryKey(hemiClient.chain?.id, address),
    select,
  })
}
