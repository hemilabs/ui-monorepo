import { useQuery } from '@tanstack/react-query'
// import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { useHemiBtcToken } from 'hooks/useHemiBtcToken'
// import { useHemiClient } from 'hooks/useHemiClient'
// import { type EvmToken } from 'types/token'
// import { getTokenByAddress } from 'utils/token'
// import { asset } from 'viem-erc4626/actions'

// TODO ideally, we would validate with the blockchain that the token is correctly set
// but optimistically using hemiBTC as the initial data. As there are no pools yet,
// I am hardcoding the token as the response, but we should later uncomment the real implementation
export const usePoolAsset = function () {
  const hemiBtc = useHemiBtcToken()
  // const hemiClient = useHemiClient()
  return useQuery({
    initialData: hemiBtc,
    queryFn: () => Promise.resolve(hemiBtc),

    // asset(hemiClient, {
    //   address: getBtcStakingVaultContractAddress(hemiClient.chain!.id),
    // }).then(
    //   tokenAddress =>
    //     getTokenByAddress(tokenAddress, hemiClient.chain!.id) as EvmToken,
    // ),
    queryKey: ['btc-staking', 'pool-asset'],
  })
}
