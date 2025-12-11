'use client'

import { Button, ButtonSize } from 'components/button'
import { Spinner } from 'components/spinner'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'
import {
  type StakingDashboardToken,
  type StakingOperationRunning,
} from 'types/stakingDashboard'

type Props = {
  buttonSize?: ButtonSize
  canStake: boolean
  token: StakingDashboardToken
  isAllowanceError: boolean
  isAllowanceLoading: boolean
  isRunningOperation: boolean
  needsApproval: boolean
  operationRunning: StakingOperationRunning
  validationError: string | undefined
}
export const SubmitStake = function ({
  buttonSize = 'xLarge',
  canStake,
  isAllowanceError,
  isAllowanceLoading,
  isRunningOperation,
  needsApproval,
  operationRunning,
  validationError,
}: Props) {
  const t = useTranslations()

  const getOperationButtonText = function () {
    const texts = {
      approve: {
        error: t('common.allowance-load-failed'),
        idle: t('staking-dashboard.form.approve-and-stake'),
        loading: t('common.approving'),
      },
      stake: {
        idle: t('staking-dashboard.form.stake'),
        loading: t('staking-dashboard.form.staking'),
      },
    }
    if (isAllowanceLoading) {
      return <Spinner size="small" />
    }
    if (isAllowanceError) {
      return texts.approve.error
    }
    if (operationRunning === 'approving') {
      return texts.approve.loading
    }
    if (operationRunning === 'staking') {
      return texts.stake.loading
    }
    if (validationError) {
      return validationError
    }
    return texts[needsApproval ? 'approve' : 'stake'].idle
  }

  return (
    <SubmitWhenConnected
      submitButton={
        <Button
          disabled={!canStake || isRunningOperation || isAllowanceLoading}
          size={buttonSize}
          type="submit"
        >
          {getOperationButtonText()}
        </Button>
      }
      submitButtonSize={buttonSize}
    />
  )
}
