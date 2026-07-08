// Shared form-state helpers so the deposit and withdraw forms don't drift.
export type PreviewIssue =
  | 'amount-too-small'
  | 'asset-unavailable'
  | 'network-error'

// The three "no shares" causes, ordered most-actionable first: network error, unavailable asset, then amount-too-small.
export function resolvePreviewIssue({
  hasShares,
  isPreviewError,
  isPreviewLoading,
  peggedAmount,
  validInput,
}: {
  hasShares: boolean
  isPreviewError: boolean
  isPreviewLoading: boolean
  // undefined = preview not ready; 0n = the Gateway returned nothing (asset paused/blocked, not amount too small).
  peggedAmount: bigint | undefined
  validInput: boolean
}): PreviewIssue | undefined {
  if (!validInput || isPreviewLoading) return undefined
  if (isPreviewError) return 'network-error'
  if (peggedAmount === undefined) return undefined
  if (peggedAmount === BigInt(0)) return 'asset-unavailable'
  if (!hasShares) return 'amount-too-small'
  return undefined
}

export const resolveErrorKey = (
  isConnected: boolean,
  balanceLoaded: boolean,
  errorKey: string | undefined,
) => (isConnected && balanceLoaded ? errorKey : undefined)

export const computeIsLoading = ({
  balanceLoaded,
  isAllowanceLoading,
  isPreviewLoading,
  validInput,
}: {
  balanceLoaded: boolean
  isAllowanceLoading: boolean
  isPreviewLoading: boolean
  validInput: boolean
}) => isAllowanceLoading || !balanceLoaded || (validInput && isPreviewLoading)

// Preview issue takes precedence — it's more specific and mutually exclusive with the validation error.
export const resolveValidationError = (
  previewIssueMessage: string | undefined,
  validationError: string | undefined,
) => previewIssueMessage ?? validationError
