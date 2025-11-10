import { useQuery } from '@tanstack/react-query'
import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { useHemiClient } from 'hooks/useHemiClient'
import { formatUnits } from 'viem'
import { decimals } from 'viem-erc20/actions'
import { totalAssets } from 'viem-erc4626/actions'

export const usePoolDeposits = function () {
  const hemiClient = useHemiClient()
  return useQuery({
    async queryFn() {
      const address = getBtcStakingVaultContractAddress(hemiClient.chain!.id)

      const [tokenDecimals, assets] = await Promise.all([
        decimals(hemiClient, { address }),
        totalAssets(hemiClient, {
          address,
        }),
      ])

      return formatUnits(assets, tokenDecimals)
    },
    queryKey: ['btc-staking', 'pool-deposits', hemiClient.chain?.id],
  })
}
