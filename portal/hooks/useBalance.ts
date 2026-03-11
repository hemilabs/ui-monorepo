import { useNativeBalance as useNativeTokenBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { EvmToken } from 'types/token'
import { isNativeAddress } from 'utils/nativeToken'
import { type Address, erc20Abi, isAddress } from 'viem'
import { useAccount, useReadContract } from 'wagmi'

export { useNativeTokenBalance }

export const useTokenBalance = function (
  chainId: EvmToken['chainId'],
  tokenAddress: string,
) {
  const { address, isConnected } = useAccount()
  return useReadContract({
    abi: erc20Abi,
    address: tokenAddress as Address,
    args: address ? [address] : undefined,
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
}
