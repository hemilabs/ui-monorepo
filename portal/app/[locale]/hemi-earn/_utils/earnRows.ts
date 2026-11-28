import { type Token } from 'types/token'
import { getAddress, type Address } from 'viem'

import {
  type EarnPosition,
  type EarnTransaction,
  type EarnVault,
  type LocalEarnOperation,
} from '../types'

import { isEarnRowInFlight, needsRecover } from './transactionPredicates'
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

// Shares of a cancelled redeem, waiting for the user to recover them: already out of the
// wallet, yet still in the cost basis, which Vetro only disposes on PENDING or once
// processed. The earned card adds them back so both sides cover the same shares.
export const sumInTransitSharesByShare = (
  transactions: EarnTransaction[],
  vaults: EarnVault[],
) =>
  transactions.reduce<Record<string, bigint>>(function (acc, tx) {
    if (tx.kind !== 'REDEEM' || !needsRecover(tx)) return acc
    const shareAddress = findVaultByAsset(vaults, tx.asset)?.shareAddress
    if (!shareAddress) return acc
    const key = getAddress(shareAddress)
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
  const held = new Set(positions.map(p => getAddress(p.shareAddress)))
  return Object.keys(inTransitByShare)
    .filter(share => !held.has(getAddress(share as Address)))
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
