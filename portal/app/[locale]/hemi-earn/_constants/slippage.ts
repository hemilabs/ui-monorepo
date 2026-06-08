// Redeem is wider than deposit because `amountOutMin` is frozen across the
// ~7d cooldown — yield drift or fee changes in that window would otherwise
// revert `claimUnstake`. User-selectable slippage tracked in #1981.
export const DEPOSIT_SLIPPAGE_BPS = BigInt(50)
export const REDEEM_SLIPPAGE_BPS = BigInt(100)

const BPS_DENOMINATOR = BigInt(10000)

// Clamps to `1n` when floor-division would round the result to `0n` —
// otherwise the on-chain `*OutMin` would silently accept a zero-out
// fulfillment. Rejects `bps` outside `[0, BPS_DENOMINATOR]` so a
// misconfigured value can't slip past the clamp into the same failure mode.
export function applySlippage(amount: bigint, bps: bigint): bigint {
  if (bps < BigInt(0) || bps > BPS_DENOMINATOR) {
    throw new RangeError(
      `applySlippage: bps must be in [0, ${BPS_DENOMINATOR}], got ${bps}`,
    )
  }
  if (amount <= BigInt(0)) return BigInt(0)
  const result = (amount * (BPS_DENOMINATOR - bps)) / BPS_DENOMINATOR
  return result > BigInt(0) ? result : BigInt(1)
}
