import { useQuery } from '@tanstack/react-query'
import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { convertToShares } from 'viem-erc4626/actions'
import { useAccount } from 'wagmi'

export const useConvertToShares = function ({
  assets,
  enabled = true,
}: {
  assets: bigint
  enabled?: boolean
}) {
  const hemi = useHemi()
  const hemiClient = useHemiClient()
  const { address } = useAccount()

  const isEnabled = enabled && !!address && assets > BigInt(0)

  return useQuery({
    enabled: isEnabled && !!hemiClient,
    queryFn: () =>
      convertToShares(hemiClient, {
        address: getBtcStakingVaultContractAddress(hemi.id),
        assets,
      }),
    queryKey: ['convert-to-shares', assets.toString(), hemi.id],
  })
}
