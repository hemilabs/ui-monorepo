import Big from 'big.js'
import { TokenWithBalance } from 'types/token'
import { formatUnits } from 'viem'

import { getTokenPrice } from './token'

/**
 * Calculates the total USD value of a list of tokens with their balances.
 * @param tokensWithBalance - Array of tokens with their balance information
 * @param prices - Object mapping token symbols to their USD prices
 * @returns Total USD value as a Big number
 */
export const calculateUsdValue = (
  tokensWithBalance: TokenWithBalance[],
  prices: Record<string, string>,
) =>
  tokensWithBalance
    .reduce(
      (acc, token) =>
        acc.plus(
          Big(formatUnits(token.balance, token.decimals)).times(
            getTokenPrice(token, prices),
          ),
        ),
      Big(0),
    )
    .toFixed()
