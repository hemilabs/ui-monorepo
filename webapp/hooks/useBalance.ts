import { Token } from 'types/token'
import { isNativeToken } from 'utils/token'
import { useAccount, useBalance as useWagmiBalance } from 'wagmi'

export const useNativeTokenBalance = function (
  token: Token,
  enabled: boolean = true,
) {
  const { address } = useAccount()
  const { data, status } = useWagmiBalance({
    address,
    chainId: token.chainId,
    enabled,
    formatUnits: 'wei',
    watch: true,
    // for native tokens, address must be omited
    // Once updated to wagmi v2.x, we should be able to remove this line
    ...(isNativeToken(token) ? { token: token.address as `0x${string}` } : {}),
  })

  return {
    balance: status === 'error' ? BigInt(0) : data?.value,
    status,
  }
}

// Once we migrate to wagmi v2.x, we should update this hook
// as token balances will use a different wagmi hook.
// See https://wagmi.sh/react/guides/migrate-from-v1-to-v2
export const useTokenBalance = (token: Token, enabled: boolean = true) =>
  useNativeTokenBalance(token, enabled)
