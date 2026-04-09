import { queryOptions, useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { type Address, type Chain, type PublicClient } from 'viem'
import { balanceOf, convertToAssets } from 'viem-erc4626/actions'
import { useAccount } from 'wagmi'

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
  hemiClient,
  vaultAddress,
}: {
  address: Address
  chainId: Chain['id']
  hemiClient: PublicClient
  vaultAddress: Address
}) =>
  queryOptions({
    async queryFn() {
      const shares = await balanceOf(hemiClient, {
        account: address,
        address: vaultAddress,
      })

      if (shares === BigInt(0)) {
        return BigInt(0)
      }

      return convertToAssets(hemiClient, {
        address: vaultAddress,
        shares,
      })
    },
    queryKey: getUserVaultBalanceQueryKey({ chainId, vaultAddress }),
  })

export const useUserVaultBalance = function (vaultAddress: Address) {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const { address } = useAccount()

  return useQuery({
    ...userVaultBalanceQueryOptions({
      address: address!,
      chainId,
      hemiClient: hemiClient!,
      vaultAddress,
    }),
    enabled: !!address && !!hemiClient,
  })
}
