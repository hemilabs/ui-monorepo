'use client'

import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useTranslations } from 'next-intl'
import { StakingDashboardToken } from 'types/stakingDashboard'

type Props = {
  canStake: boolean
  token: StakingDashboardToken
  isRunningOperation: boolean
  operationRunning: 'idle' | 'staking'
  validationError: string | undefined
}
export const SubmitStake = function ({
  canStake,
  isRunningOperation,
  operationRunning,
  token,
  validationError,
}: Props) {
  const t = useTranslations('staking-dashboard.form')

  const getOperationButtonText = function () {
    const texts = {
      stake: {
        idle: t('stake'),
        loading: t('staking'),
      },
    }
    if (operationRunning === 'staking') {
      return texts.stake.loading
    }
    if (validationError) {
      return validationError
    }
    return texts.stake.idle
  }

  return (
    <SubmitWhenConnectedToChain
      chainId={token.chainId}
      submitButton={
        <Button
          disabled={!canStake || isRunningOperation}
          size="xLarge"
          type="submit"
        >
          {getOperationButtonText()}
        </Button>
      }
    />
  )
}
