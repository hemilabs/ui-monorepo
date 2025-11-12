import { useQuery } from '@tanstack/react-query'
import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { useHemiBtcToken } from 'hooks/useHemiBtcToken'
import { useHemiClient } from 'hooks/useHemiClient'
import { type EvmToken } from 'types/token'
import { getTokenByAddress } from 'utils/token'
import { asset } from 'viem-erc4626/actions'

export const usePoolAsset = function () {
  const hemiBtc = useHemiBtcToken()
  const hemiClient = useHemiClient()

  return useQuery({
    initialData: hemiBtc,
    queryFn: () =>
      asset(hemiClient, {
        address: getBtcStakingVaultContractAddress(hemiClient.chain!.id),
      }).then(
        tokenAddress =>
          getTokenByAddress(tokenAddress, hemiClient.chain!.id) as EvmToken,
      ),
    queryKey: ['btc-staking', 'pool-asset', hemiClient.chain!.id],
  })
}
