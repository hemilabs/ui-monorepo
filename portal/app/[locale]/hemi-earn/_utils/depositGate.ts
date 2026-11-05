export const resolveDepositGate = (depositsPaused: boolean) =>
  depositsPaused
    ? { canDeposit: false as const, reason: 'deposits-paused' as const }
    : { canDeposit: true as const, reason: undefined }
