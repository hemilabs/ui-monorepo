import { featureFlags } from 'app/featureFlags'

import { resolveDepositGate } from '../_utils/depositGate'

export const useCanDeposit = () =>
  resolveDepositGate(featureFlags.disableHemiEarnDeposits)
