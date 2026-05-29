'use client'

import { Button } from 'components/button'
import { Spinner } from 'components/spinner'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'

import { type WithdrawOperationRunning } from '../_types/operations'

type Props = {
  canWithdraw: boolean
  isAllowanceError: boolean
  isLoading: boolean
  isRunningOperation: boolean
  needsApproval: boolean
  operationRunning: WithdrawOperationRunning
  validationError: string | undefined
}

export const SubmitWithdraw = function ({
  canWithdraw,
  isAllowanceError,
  isLoading,
  isRunningOperation,
  needsApproval,
  operationRunning,
  validationError,
}: Props) {
  const t = useTranslations()

  const getOperationButtonText = function () {
    if (isLoading) {
      return <Spinner size="small" />
    }
    if (isAllowanceError) {
      return t('common.allowance-load-failed')
    }
    if (operationRunning === 'approving') {
      return t('common.approving')
    }
    if (operationRunning === 'withdrawing') {
      return t('hemi-earn.pool.form.withdrawing')
    }
    if (validationError) {
      return validationError
    }
    return t(needsApproval ? 'common.approve-and-withdraw' : 'common.withdraw')
  }

  return (
    <SubmitWhenConnected
      submitButton={
        <Button
          disabled={!canWithdraw || isRunningOperation || isLoading}
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
