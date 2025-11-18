import { useQuery } from '@tanstack/react-query'
import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { useHemiClient } from 'hooks/useHemiClient'
import { Chain } from 'viem'
import { totalAssets } from 'viem-erc4626/actions'

const getPoolDepositsQueryKey = (chainId: Chain['id'] | undefined) => [
  'btc-staking',
  'pool-deposits',
  chainId,
]

export const usePoolDeposits = function () {
  const hemiClient = useHemiClient()
  return useQuery({
    async queryFn() {
      const address = getBtcStakingVaultContractAddress(hemiClient.chain!.id)
      return totalAssets(hemiClient, {
        address,
      })
    },
    queryKey: getPoolDepositsQueryKey(hemiClient.chain?.id),
  })
}
