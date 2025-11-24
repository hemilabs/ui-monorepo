import { useQuery } from '@tanstack/react-query'
import { getVaultRewardsAddress } from 'hemi-btc-staking-actions/actions'
import { useHemiClient } from 'hooks/useHemiClient'
import { getClaimable } from 'vault-rewards-actions/actions'
import { type Chain } from 'viem'
import { useAccount } from 'wagmi'

import { PoolRewards } from '../_types'

const getPoolRewardsQueryKey = (
  chainId: Chain['id'] | undefined,
  address: string | undefined,
) => ['pool-rewards', 'claimable', chainId, address]

export const usePoolRewards = function () {
  const { address } = useAccount()
  const hemiClient = useHemiClient()

  return useQuery({
    enabled: address !== undefined,
    queryFn: () =>
      getVaultRewardsAddress(hemiClient).then(
        vaultRewardsAddress =>
          getClaimable(hemiClient, {
            account: address!,
            vaultRewardsAddress,
          }),
        // type inference works well, but this gives a more readable name
      ) as Promise<PoolRewards>,
    queryKey: getPoolRewardsQueryKey(hemiClient.chain?.id, address),
  })
}
