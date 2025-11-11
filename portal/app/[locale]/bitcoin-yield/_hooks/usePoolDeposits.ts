import { useQuery } from '@tanstack/react-query'
import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { useHemiClient } from 'hooks/useHemiClient'
import { totalAssets } from 'viem-erc4626/actions'

export const usePoolDeposits = function () {
  const hemiClient = useHemiClient()
  return useQuery({
    async queryFn() {
      const address = getBtcStakingVaultContractAddress(hemiClient.chain!.id)
      return totalAssets(hemiClient, {
        address,
      })
    },
    queryKey: ['btc-staking', 'pool-deposits', hemiClient.chain?.id],
  })
}
