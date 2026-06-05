// UX_SPEC §5.2 / §5.3: 0.5% deposit, 1.0% redeem. Redeem is wider because
// on the cooldown path `amountOutMin` is frozen for ~7 days on the Agent
// (Gotcha #6) — any yield drift or Vetro fee change in the meantime would
// otherwise revert `claimUnstake`.
// User-selectable slippage control tracked in
// https://github.com/hemilabs/ui-monorepo/issues/1981
export const DEPOSIT_SLIPPAGE_BPS = BigInt(50)
export const REDEEM_SLIPPAGE_BPS = BigInt(100)

const BPS_DENOMINATOR = BigInt(10000)

export const applySlippage = (amount: bigint, bps: bigint) =>
  (amount * (BPS_DENOMINATOR - bps)) / BPS_DENOMINATOR
