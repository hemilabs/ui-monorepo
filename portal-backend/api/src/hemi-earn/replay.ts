import { type Address } from 'viem'

// Pure Vetro-parity cost-basis accounting for Hemi Earn, replayed from a user's
// processed requests: each deposit adds its pegged `stakedAmount`; each redeem
// reduces the cost basis proportionally to the burned shares (so realized gains
// from withdrawals drop out). WAD scaling preserves precision through the
// proportional division. No I/O here — kept pure so it can be unit-tested.

export type CostBasisRow = {
  amountIn: string | null
  amountOut: string | null
  asset: string
  kind: 'DEPOSIT' | 'REDEEM'
  stakedAmount: string | null
}

type Position = { costBasis: bigint; shares: bigint }

// Fixed precision factor, NOT any token's decimals: the cost basis is scaled up
// by WAD so the integer proportional-redeem division keeps sub-unit precision.
// Callers divide back out by the same WAD_DECIMALS.
export const WAD_DECIMALS = 18
const WAD = 10n ** BigInt(WAD_DECIMALS)

const emptyPosition: Position = { costBasis: 0n, shares: 0n }

// Accrue the deposit's pegged cost basis and minted shares.
const applyDeposit = function (
  position: Position,
  row: CostBasisRow,
): Position {
  const staked = row.stakedAmount ?? null
  const minted = row.amountOut ?? null
  if (staked === null || minted === null) return position
  return {
    costBasis: position.costBasis + BigInt(staked) * WAD,
    shares: position.shares + BigInt(minted),
  }
}

// Vetro handleTransfer parity: reduce cost basis proportionally to the burned
// shares (realized gains drop out), zeroing on a full exit.
const applyRedeem = function (position: Position, row: CostBasisRow): Position {
  const redeemed = row.amountIn ?? null
  if (redeemed === null) return position
  const burned = BigInt(redeemed)
  if (burned >= position.shares) return emptyPosition
  return {
    costBasis:
      (position.costBasis * (position.shares - burned)) / position.shares,
    shares: position.shares - burned,
  }
}

// `rows` must be ordered oldest-first; `shareByAsset` maps each row's asset to
// its Hemi share OFT. Returns the WAD-scaled cost basis per share.
export const replayCostBasis = function (
  rows: CostBasisRow[],
  shareByAsset: Record<string, Address>,
) {
  const positions = new Map<Address, Position>()

  rows.forEach(function (row) {
    const share = shareByAsset[row.asset.toLowerCase()]
    if (!share) return
    const position = positions.get(share) ?? emptyPosition
    positions.set(
      share,
      row.kind === 'DEPOSIT'
        ? applyDeposit(position, row)
        : applyRedeem(position, row),
    )
  })

  return positions
}
