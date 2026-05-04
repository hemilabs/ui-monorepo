import { useQuery } from '@tanstack/react-query'
import { type Address, type Chain } from 'viem'
import { convertToShares } from 'viem-erc4626/actions'
import { useAccount, usePublicClient } from 'wagmi'

export const useConvertToShares = function ({
  assets,
  chainId,
  enabled = true,
  vaultAddress,
}: {
  assets: bigint
  chainId: Chain['id']
  enabled?: boolean
  vaultAddress: Address
}) {
  const client = usePublicClient({ chainId })
  const { address } = useAccount()

  const isEnabled = enabled && !!address && assets > BigInt(0)

  return useQuery({
    enabled: isEnabled && !!client,
    queryFn: () =>
      convertToShares(client!, {
        address: vaultAddress,
        assets,
      }),
    queryKey: ['convert-to-shares', assets.toString(), chainId, vaultAddress],
  })
}
