import { EvmToken } from 'types/token'
import { type Address } from 'viem'
import { useAccount, useBalance as useWagmiBalance } from 'wagmi'
import { useBalanceOf } from 'wagmi-erc20-hooks'

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
  token: EvmToken,
  enabled: boolean = true,
) {
  const { address, isConnected } = useAccount()
  const { data, refetch, ...rest } = useBalanceOf(token.address as Address, {
    args: { account: address, chainId: token.chainId },
    query: { enabled: isConnected && enabled },
  })

  return {
    balance: rest.status === 'error' ? BigInt(0) : data ?? BigInt(0),
    refetchTokenBalance: refetch,
    ...rest,
  }
}
