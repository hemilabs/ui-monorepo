import { useMemo } from 'react'
import { EvmToken } from 'types/token'
import { isNativeAddress } from 'utils/nativeToken'
import { type Address, erc20Abi, isAddress } from 'viem'
import {
  useAccount,
  useBalance as useWagmiBalance,
  useReadContract,
} from 'wagmi'

export const useNativeTokenBalance = function (
  chainId: EvmToken['chainId'],
  enabled: boolean = true,
) {
  const { address, isConnected } = useAccount()
  const { data, refetch, ...rest } = useWagmiBalance({
    address,
    chainId,
    query: {
      enabled: isConnected && enabled,
    },
  })

  return {
    balance: rest.status === 'error' ? BigInt(0) : data?.value ?? BigInt(0),
    refetchBalance: refetch,
    ...rest,
  }
}

export const useTokenBalance = function (
  chainId: EvmToken['chainId'],
  tokenAddress: string,
) {
  const { address, isConnected } = useAccount()

  const { data, refetch, ...rest } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress as Address,
    args: useMemo(() => [address], [address]),
    chainId,
    functionName: 'balanceOf',
    query: {
      enabled:
        isConnected &&
        !!address &&
        isAddress(address) &&
        isAddress(tokenAddress) &&
        !isNativeAddress(tokenAddress),
    },
  })

  return {
    balance: rest.status === 'error' ? BigInt(0) : data ?? BigInt(0),
    refetchTokenBalance: refetch,
    ...rest,
  }
}
