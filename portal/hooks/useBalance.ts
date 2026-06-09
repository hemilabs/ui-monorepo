import {
  tokenBalanceQueryKey,
  tokenBalanceQueryOptions,
} from '@hemilabs/react-hooks/useTokenBalance'
import { useQuery } from '@tanstack/react-query'
import { EvmToken } from 'types/token'
import { isNativeAddress } from 'utils/nativeToken'
import { type Address, isAddress } from 'viem'
import { useAccount, usePublicClient } from 'wagmi'

export const getTokenBalanceQueryKey = ({
  account,
  chainId,
  tokenAddress,
}: {
  account: Address | undefined
  chainId: EvmToken['chainId']
  tokenAddress: string
}) =>
  tokenBalanceQueryKey({ address: tokenAddress as Address, chainId }, account)

export const useTokenBalance = function (
  chainId: EvmToken['chainId'],
  tokenAddress: string,
) {
  const { address, isConnected } = useAccount()
  const client = usePublicClient({ chainId })
  return useQuery({
    ...tokenBalanceQueryOptions({
      account: address!,
      client: client!,
      token: { address: tokenAddress as Address, chainId },
    }),
    enabled:
      isConnected &&
      !!address &&
      isAddress(tokenAddress) &&
      !isNativeAddress(tokenAddress) &&
      !!client,
  })
}
