'use client'

import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'

import { type VaultWithdrawOperationRunning } from '../_types/vaultOperations'

type Props = {
  canWithdraw: boolean
  isRunningOperation: boolean
  operationRunning: VaultWithdrawOperationRunning
  validationError: string | undefined
}

export const SubmitWithdraw = function ({
  canWithdraw,
  isRunningOperation,
  operationRunning,
  validationError,
}: Props) {
  const t = useTranslations()

  const getOperationButtonText = function () {
    if (operationRunning === 'withdrawing') {
      return t('hemi-earn.vault.form.withdrawing')
    }
    if (validationError) {
      return validationError
    }
    return t('common.withdraw')
  }

  return (
    <SubmitWhenConnected
      submitButton={
        <Button
          disabled={!canWithdraw || isRunningOperation}
          size="small"
          type="submit"
        >
          {getOperationButtonText()}
        </Button>
      }
      submitButtonSize="small"
    />
  )
}
