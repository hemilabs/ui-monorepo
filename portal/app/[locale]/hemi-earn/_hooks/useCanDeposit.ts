import { featureFlags } from 'app/featureFlags'

import { resolveDepositGate } from '../_utils/depositGate'
import { findVaultByAsset } from '../_utils/vaults'
import { type EarnTransaction, type EarnVault } from '../types'

import { useEarnVaults } from './useEarnVaults'

// Pass undefined only where no vault applies (the page-wide paused banner);
export const useCanDeposit = (vault: EarnVault | undefined) =>
  resolveDepositGate({
    depositsPaused: featureFlags.disableHemiEarnDeposits,
    isListed: vault?.isListed ?? true,
  })

// Until the vault list loads, a deposit's vault can't be checked, so isPending
// tells callers to hold any deposit action instead of assuming it is listed.
export const useCanDepositForTransaction = function (
  transaction: EarnTransaction | undefined,
) {
  const { data: vaults = [], isPending: areVaultsPending } = useEarnVaults()
  const isDeposit = transaction?.kind === 'DEPOSIT'
  const vault = transaction
    ? findVaultByAsset(vaults, transaction.asset)
    : undefined
  const depositGate = useCanDeposit(vault)
  return {
    ...depositGate,
    canDeposit: depositGate.canDeposit && !(isDeposit && vault === undefined),
    isPending: isDeposit && areVaultsPending,
  }
}
