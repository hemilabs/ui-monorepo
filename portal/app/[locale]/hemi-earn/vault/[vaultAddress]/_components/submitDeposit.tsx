'use client'

import { Button } from 'components/button'
import { Spinner } from 'components/spinner'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'

import { type VaultDepositOperationRunning } from '../_types/vaultOperations'

type Props = {
  canDeposit: boolean
  isAllowanceError: boolean
  isAllowanceLoading: boolean
  isRunningOperation: boolean
  needsApproval: boolean
  operationRunning: VaultDepositOperationRunning
  validationError: string | undefined
}

export const SubmitDeposit = function ({
  canDeposit,
  isAllowanceError,
  isAllowanceLoading,
  isRunningOperation,
  needsApproval,
  operationRunning,
  validationError,
}: Props) {
  const t = useTranslations()

  const getOperationButtonText = function () {
    if (isAllowanceLoading) {
      return <Spinner size="small" />
    }
    if (isAllowanceError) {
      return t('common.allowance-load-failed')
    }
    if (operationRunning === 'approving') {
      return t('common.approving')
    }
    if (operationRunning === 'depositing') {
      return t('hemi-earn.vault.form.depositing')
    }
    if (validationError) {
      return validationError
    }
    return t(
      needsApproval
        ? 'hemi-earn.vault.form.approve-and-deposit'
        : 'hemi-earn.vault.form.deposit',
    )
  }

  return (
    <SubmitWhenConnected
      submitButton={
        <Button
          disabled={!canDeposit || isRunningOperation || isAllowanceLoading}
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
