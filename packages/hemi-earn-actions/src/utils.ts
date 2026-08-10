// The allowance to request. Never below what the transaction pulls: a caller can
// ask for a larger one to save future approvals, but a smaller one would make the
// request revert on transfer.
export const resolveApprovalAmount = ({
  approvalAmount,
  required,
}: {
  approvalAmount: bigint | undefined
  required: bigint
}) =>
  approvalAmount !== undefined && approvalAmount > required
    ? approvalAmount
    : required
