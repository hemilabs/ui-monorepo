import { type Token } from 'types/token'
import { type Address } from 'viem'

import {
  type EarnPool,
  type EarnPosition,
  type EarnTransaction,
  type LocalEarnOperation,
} from '../types'

import { findPoolByAsset, findPoolByShare } from './pools'
import { isEarnRowInFlight } from './transactionPredicates'

// DEPOSIT renders amountIn (asset units) — never amountOut, which is 18-dec shares.
// REDEEM renders shares until amountOut (the returned asset) lands at fulfillment.
export const pickEarnRowAmount = (
  transaction: EarnTransaction,
  { assetToken, shareToken }: { assetToken?: Token; shareToken?: Token },
): { rawAmount: string; token: Token | undefined } =>
  transaction.kind === 'REDEEM'
    ? {
        rawAmount: transaction.amountOut ?? transaction.amountIn,
        token: transaction.amountOut === null ? shareToken : assetToken,
      }
    : { rawAmount: transaction.amountIn, token: assetToken }

// Shares an in-flight redeem locked in the Router: gone from the wallet, but the cost
// basis hasn't disposed them yet, so the earned card adds them back to stay consistent.
export const sumInTransitSharesByShare = (
  transactions: EarnTransaction[],
  pools: EarnPool[],
) =>
  transactions.reduce<Record<string, bigint>>(function (acc, tx) {
    if (
      tx.kind !== 'REDEEM' ||
      tx.status === 'TX_PENDING' ||
      tx.amountOut !== null ||
      !isEarnRowInFlight(tx)
    )
      return acc
    const shareAddress = findPoolByAsset(pools, tx.asset)?.shareAddress
    if (!shareAddress) return acc
    const key = shareAddress.toLowerCase()
    acc[key] = (acc[key] ?? BigInt(0)) + BigInt(tx.amountIn)
    return acc
  }, {})

// Shares with in-transit balance but no live position: a 100% withdraw zeroes balanceOf,
// so the share drops out of positions. Synthesize a zero-balance row so the earned card
// still reconciles it against the cost basis instead of silently reading $0.
export const inTransitOnlyPositions = function (
  inTransitByShare: Record<string, bigint>,
  positions: EarnPosition[],
  pools: EarnPool[],
) {
  const held = new Set(positions.map(p => p.shareAddress.toLowerCase()))
  return Object.keys(inTransitByShare)
    .filter(share => !held.has(share))
    .map(share => findPoolByShare(pools, share as Address))
    .filter((pool): pool is EarnPool => pool !== undefined)
    .map(pool => ({
      peggedToken: pool.peggedToken,
      shareAddress: pool.shareAddress,
      shareToken: pool.shareToken,
      yourDeposit: BigInt(0),
    }))
}

// Any earn action still settling — drives polling for the transactions list and
// the earned card: local ops before they index, plus subgraph rows not yet terminal.
export const hasInFlightEarnActions = ({
  localOperations,
  transactions,
}: {
  localOperations: LocalEarnOperation[]
  transactions: EarnTransaction[]
}) =>
  localOperations.some(op => op.initiateTxHash !== undefined && !op.settled) ||
  transactions.some(isEarnRowInFlight)
