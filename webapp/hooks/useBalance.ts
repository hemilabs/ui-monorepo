import { EvmToken } from 'types/token'
import { useAccount, useBalance as useWagmiBalance } from 'wagmi'
import { useBalanceOf } from 'wagmi-erc20-hooks'

export const useNativeTokenBalance = function (
  chainId: EvmToken['chainId'],
  enabled: boolean = true,
) {
  const { address } = useAccount()
  const { data, fetchStatus, status, refetch } = useWagmiBalance({
    address,
    chainId,
    query: {
      enabled,
    },
  })

  return {
    balance: status === 'error' ? BigInt(0) : data?.value ?? BigInt(0),
    fetchStatus,
    refetchBalance: refetch,
    status,
  }
}

export const useTokenBalance = function (
  token: EvmToken,
  enabled: boolean = true,
) {
  const { address } = useAccount()
  const { data, fetchStatus, refetch, status } = useBalanceOf(
    token.address as `0x${string}`,
    {
      args: { account: address, chainId: token.chainId },
      query: { enabled },
    },
  )

  return {
    balance: status === 'error' ? BigInt(0) : data ?? BigInt(0),
    fetchStatus,
    refetchTokenBalance: refetch,
    status,
  }
}
