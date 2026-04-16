import { queryOptions, useQuery } from '@tanstack/react-query'
import { type Address, type Chain, type PublicClient } from 'viem'
import { balanceOf, convertToAssets } from 'viem-erc4626/actions'
import { useAccount, usePublicClient } from 'wagmi'

export const getUserVaultBalanceQueryKey = ({
  chainId,
  vaultAddress,
}: {
  chainId: Chain['id'] | undefined
  vaultAddress: Address
}) => ['hemi-earn', 'user-vault-balance', chainId, vaultAddress]

export const userVaultBalanceQueryOptions = ({
  address,
  chainId,
  client,
  vaultAddress,
}: {
  address: Address
  chainId: Chain['id']
  client: PublicClient
  vaultAddress: Address
}) =>
  queryOptions({
    async queryFn() {
      const shares = await balanceOf(client, {
        account: address,
        address: vaultAddress,
      })

      if (shares === BigInt(0)) {
        return BigInt(0)
      }

      return convertToAssets(client, {
        address: vaultAddress,
        shares,
      })
    },
    queryKey: getUserVaultBalanceQueryKey({ chainId, vaultAddress }),
  })

export const useUserVaultBalance = function (
  vaultAddress: Address,
  chainId: Chain['id'],
) {
  const client = usePublicClient({ chainId })
  const { address } = useAccount()

  return useQuery({
    ...userVaultBalanceQueryOptions({
      address: address!,
      chainId,
      client: client!,
      vaultAddress,
    }),
    enabled: !!address && !!client,
  })
}
