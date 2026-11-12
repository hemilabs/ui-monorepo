export const resolveDepositGate = ({
  depositsPaused,
  isListed,
}: {
  depositsPaused: boolean
  isListed: boolean
}) =>
  depositsPaused
    ? { canDeposit: false as const, reason: 'deposits-paused' as const }
    : !isListed
      ? { canDeposit: false as const, reason: 'vault-delisted' as const }
      : { canDeposit: true as const, reason: undefined }
