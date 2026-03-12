import {
  tokenBalanceQueryKey,
  useTokenBalance,
} from '@hemilabs/react-hooks/useTokenBalance'
import { type Address, type Chain } from 'viem'

/**
 * Adapter for @hemilabs/react-hooks/useTokenBalance. Token list uses
 * address: string for both EVM (0x...) and Bitcoin (bc1..., 1..., 3...).
 * This hook is for EVM ERC20 balance only; we cast string → Address here.
 * Call only with EVM token addresses (not native, not BTC).
 */
const useTokenBalanceAdapter = (chainId: Chain['id'], tokenAddress: string) =>
  useTokenBalance({
    address: tokenAddress as Address,
    chainId,
  })

/**
 * Same adapter for the query key (invalidation, etc.). Accepts token with
 * address: string; casts to Address only inside.
 */
const tokenBalanceQueryKeyAdapter = (
  token: { chainId: Chain['id']; address: string },
  account: Address | undefined,
) =>
  tokenBalanceQueryKey(
    { address: token.address as Address, chainId: token.chainId },
    account,
  )

export {
  useTokenBalanceAdapter as useTokenBalance,
  tokenBalanceQueryKeyAdapter as tokenBalanceQueryKey,
}
