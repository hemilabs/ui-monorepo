export type DepositBlockReason =
  | 'deposits-paused'
  | 'restricted-location'
  | 'sanctioned-wallet'
  | 'screening-unavailable'
  | 'vault-delisted'

const blocked = (reason: DepositBlockReason) => ({
  canDeposit: false,
  isChecking: false,
  reason,
})

export const resolveDepositGate = function ({
  depositsPaused,
  isListed,
  isSanctioned,
  isScreening,
  restrictedLocation,
  screeningFailed,
}: {
  depositsPaused: boolean
  isListed: boolean
  isSanctioned: boolean
  isScreening: boolean
  restrictedLocation: boolean
  screeningFailed: boolean
}) {
  if (depositsPaused) {
    return blocked('deposits-paused')
  }
  if (restrictedLocation) {
    return blocked('restricted-location')
  }
  if (!isListed) {
    return blocked('vault-delisted')
  }
  if (isScreening) {
    return { canDeposit: false, isChecking: true, reason: undefined }
  }
  if (isSanctioned) {
    return blocked('sanctioned-wallet')
  }
  if (screeningFailed) {
    return blocked('screening-unavailable')
  }
  return { canDeposit: true, isChecking: false, reason: undefined }
}

export const depositBlockMessageKey = function (reason: DepositBlockReason) {
  if (reason === 'screening-unavailable') {
    return 'common.unexpected-error' as const
  }
  return `hemi-earn.${reason}` as const
}
