import { Token } from 'types/token'
import { useAccount, useBalance as useWagmiBalance } from 'wagmi'

export const useNativeTokenBalance = function (
  chainId: Token['chainId'],
  enabled: boolean = true,
) {
  const { address } = useAccount()
  const { data, status, refetch } = useWagmiBalance({
    address,
    chainId,
    enabled,
    formatUnits: 'wei',
  })

  return {
    balance: status === 'error' ? BigInt(0) : data?.value ?? BigInt(0),
    refetchBalance: refetch,
    status,
  }
}

// Once we migrate to wagmi v2.x, we should update this hook
// as token balances will use a different wagmi hook.
// See https://wagmi.sh/react/guides/migrate-from-v1-to-v2
export const useTokenBalance = function (
  token: Token,
  enabled: boolean = true,
) {
  const { address } = useAccount()
  const { data, status, refetch } = useWagmiBalance({
    address,
    chainId: token.chainId,
    enabled,
    formatUnits: 'wei',
    token: token.address as `0x${string}`,
  })

  return {
    balance: status === 'error' ? BigInt(0) : data?.value ?? BigInt(0),
    refetchBalance: refetch,
    status,
  }
}
