import { type Token } from 'types/token'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { minLockAmount } from 've-hemi-actions'
import { formatUnits } from 'viem'

import { getLockupErrorMessage } from './lockupError'

type Translate = Parameters<typeof validateSubmit>[0]['t']

export const getStakeValidation = function ({
  balance,
  input,
  lockupDays,
  t,
  token,
}: {
  balance: {
    data: bigint | undefined
    isError: boolean
    isPending: boolean
  }
  input: string
  lockupDays: number
  t: Translate
  token: Token
}) {
  const { canSubmit, error, errorKey } = validateSubmit({
    amountInput: input,
    balance: balance.isError ? parseTokenUnits(input, token) : balance.data,
    minAmount: formatUnits(minLockAmount, token.decimals),
    operation: 'stake',
    t,
    token,
  })

  const lockupError = getLockupErrorMessage({ value: lockupDays })

  return {
    canStake: canSubmit && lockupError === undefined,
    errorKey,
    validationError: balance.isPending
      ? undefined
      : (error ?? (lockupError && t(lockupError.key, lockupError.values))),
  }
}
