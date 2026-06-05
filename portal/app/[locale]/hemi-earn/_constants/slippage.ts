// UX_SPEC §5.2 / §5.3: 0.5% deposit, 1.0% redeem. Redeem is wider because
// on the cooldown path `amountOutMin` is frozen for ~7 days on the Agent
// (Gotcha #6) — any yield drift or Vetro fee change in the meantime would
// otherwise revert `claimUnstake`.
// User-selectable slippage control tracked in
// https://github.com/hemilabs/ui-monorepo/issues/1981
export const DEPOSIT_SLIPPAGE_BPS = BigInt(50)
export const REDEEM_SLIPPAGE_BPS = BigInt(100)

const BPS_DENOMINATOR = BigInt(10000)

// Clamps to `1n` when `amount > 0n` but floor-division rounds the result to
// `0n` — otherwise the on-chain `*OutMin` would silently accept a zero-out
// fulfillment, defeating the slippage guard for tiny inputs.
// Rejects `bps` outside `[0, BPS_DENOMINATOR]` loudly so caller-side input
// bugs (e.g. user-selectable slippage in #1981) don't silently produce
// negative results that the clamp would also collapse to `1n`.
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
