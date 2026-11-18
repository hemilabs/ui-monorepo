import { type DepositBlockReason } from './depositGate'

export const resolveRecoveryActions = function ({
  canDeposit,
  category,
  isDeposit,
  reason,
}: {
  canDeposit: boolean
  category: string | undefined
  isDeposit: boolean
  reason: DepositBlockReason | undefined
}) {
  const blockedPermanently =
    reason !== undefined && reason !== 'screening-unavailable'

  return {
    cancelOnly: category === 'slippage' || (isDeposit && blockedPermanently),
    retryBlocked: isDeposit && !canDeposit,
  }
}
