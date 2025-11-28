import { useQuery } from '@tanstack/react-query'
import { getVaultRewardsAddress } from 'hemi-btc-staking-actions/actions'
import { useHemiClient } from 'hooks/useHemiClient'
import { type Chain } from 'viem'

const getVaultRewardsAddressQueryKey = (chainId: Chain['id'] | undefined) => [
  'vault-rewards-address',
  chainId,
]

export const useVaultRewardsAddress = function () {
  const hemiClient = useHemiClient()

  return useQuery({
    enabled: !!hemiClient.chain,
    queryFn: () => getVaultRewardsAddress(hemiClient),
    queryKey: getVaultRewardsAddressQueryKey(hemiClient.chain?.id),
  })
}
