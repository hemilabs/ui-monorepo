// How much allowance the extra-approval setting requests, as a multiple of the
// operation amount. The copy spells the multiple out, so the test pinning this
// to 10 is what keeps the label honest.
export const extraApprovalMultiplier = 10

// undefined lets the action approve exactly what it pulls, which for a redeem can
// exceed the requested amount once the dust snap rounds it up to the full balance.
export const getExtraApprovalAmount = (amount: bigint, enabled: boolean) =>
  enabled && amount > BigInt(0)
    ? amount * BigInt(extraApprovalMultiplier)
    : undefined

// The allowance the approval tx will request, for the callers that need a concrete
// number rather than the action's "approve whatever you pull" default.
export const getApprovalAmount = (amount: bigint, enabled: boolean) =>
  getExtraApprovalAmount(amount, enabled) ?? amount
