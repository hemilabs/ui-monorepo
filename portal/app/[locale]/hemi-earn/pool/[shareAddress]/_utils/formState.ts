// Shared form-state helpers for the deposit and withdraw forms. Both forms
// derive their submit-button state from the same pieces (wallet connected,
// balance loaded, allowance loaded, preview loading) and surface the same
// kinds of preview issues (floor-rounded dust, asset unavailable, network
// error). Keeping the logic here prevents drift between the two forms.

export type PreviewIssue =
  | 'amount-too-small'
  | 'asset-unavailable'
  | 'network-error'

// Discriminates the three distinct "no shares" causes the form can hit after
// the preview resolves. Ordered most-actionable first: a network error means
// "retry"; an unavailable asset means "wait / pick another"; only the
// remaining shares-rounded-to-zero case is a genuine "amount too small".
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
  // Intermediate pegged-token value from the on-chain preview. `undefined`
  // when the upstream quote/preview hasn't produced one yet. `0n` is the
  // signal that the Gateway returned nothing — the asset is paused or
  // blocked, not that the requested amount was too small.
  peggedAmount: bigint | undefined
  validInput: boolean
}): PreviewIssue | undefined {
  if (!validInput || isPreviewLoading) return undefined
  if (isPreviewError) return 'network-error'
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

// `previewIssueMessage` takes precedence when set — the preview issue is
// always more specific than the upstream validation error, and the two are
// mutually exclusive in practice (`resolvePreviewIssue` gates on `validInput`).
export const resolveValidationError = (
  previewIssueMessage: string | undefined,
  validationError: string | undefined,
) => previewIssueMessage ?? validationError
