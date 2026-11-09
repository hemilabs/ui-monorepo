import { featureFlags } from 'app/featureFlags'
import { useAccount } from 'wagmi'

import { resolveDepositGate } from '../_utils/depositGate'
import { isRestrictedLocation } from '../_utils/restrictedLocation'
import { findVaultByAsset } from '../_utils/vaults'
import { type EarnTransaction, type EarnVault } from '../types'

import { useEarnVaults } from './useEarnVaults'
import { useIsSanctioned } from './useIsSanctioned'

// Pass undefined only where no vault applies (the page-wide paused banner);
export const useCanDeposit = function (vault: EarnVault | undefined) {
  const { address } = useAccount()
  const { data: isSanctioned, isError } = useIsSanctioned()

  return resolveDepositGate({
    depositsPaused: featureFlags.disableHemiEarnDeposits,
    isListed: vault?.isListed ?? true,
    isSanctioned: !!isSanctioned,
    isScreening: !!address && isSanctioned === undefined && !isError,
    restrictedLocation: isRestrictedLocation(),
    screeningFailed: isError && isSanctioned === undefined,
  })
}

// Until the vault list loads, a deposit's vault can't be checked, so isPending
// tells callers to hold any deposit action instead of assuming it is listed.
export const useCanDepositForTransaction = function (
  transaction: EarnTransaction | undefined,
) {
  const { data: vaults = [], isPending: areVaultsPending } = useEarnVaults()
  const depositGate = useCanDeposit(
    transaction ? findVaultByAsset(vaults, transaction.asset) : undefined,
  )
  return {
    ...depositGate,
    isPending: transaction?.kind === 'DEPOSIT' && areVaultsPending,
  }
}
