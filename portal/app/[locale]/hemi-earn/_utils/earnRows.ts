import { type Token } from 'types/token'
import { type Address } from 'viem'

import {
  type EarnVault,
  type EarnPosition,
  type EarnTransaction,
  type LocalEarnOperation,
} from '../types'

import { isEarnRowInFlight } from './transactionPredicates'
import { findVaultByAsset, findVaultByShare } from './vaults'

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
  vaults: EarnVault[],
) =>
  transactions.reduce<Record<string, bigint>>(function (acc, tx) {
    if (
      tx.kind !== 'REDEEM' ||
      tx.status === 'TX_PENDING' ||
      tx.amountOut !== null ||
      !isEarnRowInFlight(tx)
    )
      return acc
    const shareAddress = findVaultByAsset(vaults, tx.asset)?.shareAddress
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
  vaults: EarnVault[],
) {
  const held = new Set(positions.map(p => p.shareAddress.toLowerCase()))
  return Object.keys(inTransitByShare)
    .filter(share => !held.has(share))
    .map(share => findVaultByShare(vaults, share as Address))
    .filter((vault): vault is EarnVault => vault !== undefined)
    .map(vault => ({
      peggedToken: vault.peggedToken,
      shareAddress: vault.shareAddress,
      shareToken: vault.shareToken,
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
