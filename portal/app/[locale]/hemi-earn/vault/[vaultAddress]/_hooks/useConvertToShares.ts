import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { type Address } from 'viem'
import { convertToShares } from 'viem-erc4626/actions'
import { useAccount } from 'wagmi'

export const useConvertToShares = function ({
  assets,
  enabled = true,
  vaultAddress,
}: {
  assets: bigint
  enabled?: boolean
  vaultAddress: Address
}) {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const { address } = useAccount()

  const isEnabled = enabled && !!address && assets > BigInt(0)

  return useQuery({
    enabled: isEnabled && !!hemiClient,
    queryFn: () =>
      convertToShares(hemiClient, {
        address: vaultAddress,
        assets,
      }),
    queryKey: ['convert-to-shares', assets.toString(), chainId, vaultAddress],
  })
}
