import { sanitizeAmount } from 'utils/form'

import { type StakingDashboardSeed } from '../_hooks/useStakingDashboardState'

import { isValidLockup } from './lockupError'

type StakePrefillParams = {
  amount: string | null
  lockupDays: number | null
}

export const parseStakePrefill = function ({
  amount,
  lockupDays,
}: StakePrefillParams) {
  const prefill: StakingDashboardSeed = {}

  const sanitized = amount === null ? undefined : sanitizeAmount(amount)
  if (sanitized && 'value' in sanitized && Number(sanitized.value) > 0) {
    prefill.input = sanitized.value
  }
  if (lockupDays !== null && isValidLockup({ value: lockupDays })) {
    prefill.inputDays = String(lockupDays)
    prefill.lockupDays = lockupDays
  }

  return prefill
}
