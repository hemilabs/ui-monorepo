// A smaller allowance than what the transaction pulls would revert on transfer, so
// it is rejected rather than silently corrected — the caller has a bug to fix.
export const resolveApprovalAmount = function ({
  approvalAmount,
  required,
}: {
  approvalAmount: bigint | undefined
  required: bigint
}) {
  if (approvalAmount !== undefined && approvalAmount < required) {
    throw new Error(
      `approval amount ${approvalAmount} is below the required ${required}`,
    )
  }
  return approvalAmount ?? required
}
