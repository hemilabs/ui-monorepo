// Redeem is wider than deposit: amountOutMin is frozen across the ~7d cooldown,
// so yield or fee drift in that window could otherwise revert claimUnstake.
export const DEPOSIT_SLIPPAGE_BPS = BigInt(50)
export const REDEEM_SLIPPAGE_BPS = BigInt(100)

const BPS_DENOMINATOR = BigInt(10000)

// Clamp to 1n so a floor-divided 0n can't become an on-chain "accept zero out";
// reject out-of-range bps so a misconfigured value can't slip into the same failure mode.
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
