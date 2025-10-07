'use client'

import { Button, ButtonSize } from 'components/button'
import { Spinner } from 'components/spinner'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
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
  token,
  validationError,
}: Props) {
  const t = useTranslations('staking-dashboard.form')

  const getOperationButtonText = function () {
    const texts = {
      approve: {
        error: t('allowance-load-failed'),
        idle: t('approve-and-stake'),
        loading: t('approving'),
      },
      stake: {
        idle: t('stake'),
        loading: t('staking'),
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
    <SubmitWhenConnectedToChain
      chainId={token.chainId}
      submitButton={
        <Button
          disabled={!canStake || isRunningOperation || isAllowanceLoading}
          size={buttonSize}
          type="submit"
        >
          {getOperationButtonText()}
        </Button>
      }
    />
  )
}
