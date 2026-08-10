// Percent values, matching what the Advanced settings panel shows the user.
// Redeem is wider than deposit: amountOutMin is frozen across the ~7d cooldown,
// so yield or fee drift in that window could otherwise revert claimUnstake.
export const defaultDepositSlippage = 0.5
export const defaultRedeemSlippage = 1

export const highSlippageThreshold = 5
export const veryHighSlippageThreshold = 10

// A zero tolerance makes minOut equal the quote exactly, which only holds if the
// rate doesn't move between the request and the remote fulfillment — and for a
// redeem that window is the whole ~7d cooldown. Floor it instead of allowing 0.
export const minSlippage = 0.1
export const maxSlippage = 100

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
