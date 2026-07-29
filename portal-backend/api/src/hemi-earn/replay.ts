import { type Address } from 'viem'

// Pure Vetro-parity cost-basis accounting for Hemi Earn. Acquisitions (deposits,
// peer-to-peer transfers in) add their cost + shares; disposals (redeems,
// transfers out) reduce the cost basis proportionally to the shares that leave,
// so realized value drops out. WAD scaling preserves precision through the
// proportional division. No I/O — kept pure so it can be unit-tested.

export type RatePoint = { denominator: string; numerator: string }

export type CostBasisEvent =
  | { kind: 'DEPOSIT'; share: string; shares: string; staked: string | null }
  | { kind: 'REDEEM'; share: string; shares: string }
  | {
      kind: 'TRANSFER_IN'
      rate: RatePoint | null
      share: string
      value: string
    }
  | { kind: 'TRANSFER_OUT'; share: string; value: string }

type Position = { costBasis: bigint; shares: bigint }

export const WAD_DECIMALS = 18
const WAD = 10n ** BigInt(WAD_DECIMALS)

const emptyPosition: Position = { costBasis: 0n, shares: 0n }

// FMV of a received share: priced by the share->asset rate closest to the
// transfer, WAD-scaled to match the deposit cost basis.
const priceTransferIn = (value: string, rate: RatePoint): bigint =>
  (BigInt(value) * BigInt(rate.numerator) * WAD) / BigInt(rate.denominator)

const acquire = (
  position: Position,
  { cost, shares }: { cost: bigint; shares: bigint },
): Position => ({
  costBasis: position.costBasis + cost,
  shares: position.shares + shares,
})

// Vetro handleTransfer parity: realized value drops out; a full exit zeroes.
const dispose = function (position: Position, shares: bigint): Position {
  if (shares >= position.shares) return emptyPosition
  return {
    costBasis:
      (position.costBasis * (position.shares - shares)) / position.shares,
    shares: position.shares - shares,
  }
}

const applyEvent = function (
  position: Position,
  event: CostBasisEvent,
): Position {
  if (event.kind === 'DEPOSIT') {
    return acquire(position, {
      cost: event.staked === null ? 0n : BigInt(event.staked) * WAD,
      shares: BigInt(event.shares),
    })
  }
  if (event.kind === 'TRANSFER_IN') {
    return acquire(position, {
      cost: event.rate === null ? 0n : priceTransferIn(event.value, event.rate),
      shares: BigInt(event.value),
    })
  }
  if (event.kind === 'REDEEM') {
    return dispose(position, BigInt(event.shares))
  }
  return dispose(position, BigInt(event.value))
}

// `events` must be ordered oldest-first and keyed by the Hemi share OFT (asset
// -> share is resolved upstream). Returns the WAD-scaled cost basis per share.
export const replayCostBasis = function (events: CostBasisEvent[]) {
  const positions = new Map<Address, Position>()
  events.forEach(function (event) {
    const share = event.share as Address
    positions.set(
      share,
      applyEvent(positions.get(share) ?? emptyPosition, event),
    )
  })
  return positions
}
