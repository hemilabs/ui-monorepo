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

export const useCanDepositForTransaction = function (
  transaction: EarnTransaction | undefined,
) {
  const { data: vaults = [] } = useEarnVaults()
  return useCanDeposit(
    transaction ? findVaultByAsset(vaults, transaction.asset) : undefined,
  )
}
