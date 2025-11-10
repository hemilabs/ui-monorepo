import { useQuery } from '@tanstack/react-query'
import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { useHemi } from 'hooks/useHemi'
import { getTokenHolders } from 'utils/explorerApi'

export const useHolders = function () {
  const hemi = useHemi()
  return useQuery({
    queryFn: () =>
      getTokenHolders({
        address: getBtcStakingVaultContractAddress(hemi.id),
        hemi,
      }),
    queryKey: ['bitcoin-yield', 'holders', hemi.id],
  })
}
