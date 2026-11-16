import { LazyConnectEvmWallet } from 'components/lazyConnectEvmWallet'
import { useHemiToken } from 'hooks/useHemiToken'
import { type FormEvent } from 'react'
import { useTranslations } from 'use-intl'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { SubmitStake } from '../../_components/submitStake'
import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { type useStakeSubmission } from '../../_hooks/useStakeSubmission'
import { useEstimator } from '../_context/estimatorContext'

type Props = {
  submission: ReturnType<typeof useStakeSubmission>
}

export const StakeFromEstimator = function ({ submission }: Props) {
  const { amount, inputDays, lockupDays } = useEstimator()
  const { updateInput, updateInputDays, updateLockupDays } =
    useStakingDashboard()
  const t = useTranslations()
  const token = useHemiToken()
  const { status } = useAccount()

  const {
    canStake,
    isAllowanceError,
    isAllowanceLoading,
    isRunningOperation,
    needsApproval,
    operationRunning,
    submit,
    validationError,
  } = submission

  if (!walletIsConnected(status)) {
    return (
      <LazyConnectEvmWallet
        buttonSize="xLarge"
        text={t('common.connect-wallet')}
      />
    )
  }

  const handleSubmit = function (e: FormEvent) {
    e.preventDefault()
    updateInput(amount)
    updateInputDays(inputDays)
    updateLockupDays(lockupDays)
    submit()
  }

  return (
    <form className="flex w-full [&>button]:w-full" onSubmit={handleSubmit}>
      <SubmitStake
        canStake={canStake}
        isAllowanceError={isAllowanceError}
        isAllowanceLoading={isAllowanceLoading}
        isRunningOperation={isRunningOperation}
        needsApproval={needsApproval}
        operationRunning={operationRunning}
        token={token}
        validationError={validationError}
      />
    </form>
  )
}
