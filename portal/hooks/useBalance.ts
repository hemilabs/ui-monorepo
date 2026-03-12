import {
  tokenBalanceQueryKey,
  useTokenBalance,
} from '@hemilabs/react-hooks/useTokenBalance'
import { isNativeAddress } from 'utils/nativeToken'
import {
  type Address,
  type Chain,
  isAddress as isViemAddress,
  zeroAddress,
} from 'viem'

const isErc20Address = (address: string) =>
  isViemAddress(address, { strict: false }) && !isNativeAddress(address)

/**
 * Adapter for @hemilabs/react-hooks/useTokenBalance. Token list uses
 * address: string for both EVM (0x...) and native symbols (e.g. 'ETH').
 * Only runs the balance query for valid ERC20 addresses; skips when native
 * or invalid to avoid RPC errors.
 */
const useTokenBalanceAdapter = (chainId: Chain['id'], tokenAddress: string) =>
  useTokenBalance({
    address: (isErc20Address(tokenAddress)
      ? tokenAddress
      : zeroAddress) as Address,
    chainId,
    enabled: isErc20Address(tokenAddress),
  } as Parameters<typeof useTokenBalance>[0])

/** Placeholder key when token is native or not a valid ERC20 address (avoids throwing). */
const NATIVE_OR_INVALID_TOKEN_BALANCE_KEY = [
  'token-balance',
  'native-or-invalid',
] as const

/**
 * Same adapter for the query key (invalidation, etc.). Returns a safe placeholder
 * key for native/invalid addresses so callers don't throw when building the key.
 */
const tokenBalanceQueryKeyAdapter = (
  token: { chainId: Chain['id']; address: string },
  account: Address | undefined,
): readonly unknown[] =>
  isErc20Address(token.address)
    ? tokenBalanceQueryKey(
        { address: token.address as Address, chainId: token.chainId },
        account,
      )
    : [...NATIVE_OR_INVALID_TOKEN_BALANCE_KEY, token.chainId, account ?? '']

export {
  useTokenBalanceAdapter as useTokenBalance,
  tokenBalanceQueryKeyAdapter as tokenBalanceQueryKey,
}
