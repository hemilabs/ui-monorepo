import { Token } from 'types/token'
import { useAccount, useBalance as useWagmiBalance } from 'wagmi'

export const useNativeTokenBalance = function (token: Token) {
  const { address } = useAccount()
  const { data, status } = useWagmiBalance({
    address,
    chainId: token.chainId,
    formatUnits: 'wei',
    watch: true,
    // for native tokens, address must be omited
    ...(token.address.startsWith('0x')
      ? { token: token.address as `0x${string}` }
      : {}),
  })

  return {
    balance: status === 'error' ? BigInt(0) : data?.value,
    status,
  }
}

// Once we migrate to wagmi v2.x, we should update this hook
// as token balances will use a different wagmi hook.
// See https://wagmi.sh/react/guides/migrate-from-v1-to-v2
export const useTokenBalance = (token: Token) => useNativeTokenBalance(token)
