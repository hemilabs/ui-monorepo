import { ChainLabel } from 'components/reviewOperation/chainLabel'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { type ReactNode, useState } from 'react'
import {
  StakingDashboardStatus,
  type StakingDashboardStatusType,
  type StakingOperationRunning,
} from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'
import { getNativeToken } from 'utils/nativeToken'
import { formatUnits } from 'viem'

import { useStakingDashboard } from '../../../_context/stakingDashboardContext'
import { useEstimateToggleAutoRelockFees } from '../../../_hooks/useEstimateToggleAutoRelockFees'
import { useToggleAutoRelock } from '../../../_hooks/useToggleAutoRelock'
import { Operation } from '../../operation'

import { Preview } from './preview'
import { RetryAutoRelock } from './retryAutoRelock'

type Props = {
  onClose: VoidFunction
}

export const ReviewAutoRelock = function ({ onClose }: Props) {
  const {
    resetStateAfterOperation,
    stakingDashboardOperation,
    updateStakingDashboardOperation,
  } = useStakingDashboard()

  const [operationRunning, setOperationRunning] =
    useState<StakingOperationRunning>('idle')

  const {
    autoRelock = false,
    stakingPosition,
    transactionHash,
  } = stakingDashboardOperation!
  const { amount, effectiveLockEnd, tokenId, transferable } = stakingPosition!

  const stakingDashboardStatus =
    stakingDashboardOperation?.status ?? StakingDashboardStatus.STAKE_TX_PENDING

  const hemi = useHemi()
  const t = useTranslations()
  const tDrawer = useTranslations('hemi-stake.drawer')
  const token = useHemiToken()

  const { fees: toggleFees, isError: isToggleFeesError } =
    useEstimateToggleAutoRelockFees({
      enable: !autoRelock,
      enabled:
        stakingDashboardStatus !== StakingDashboardStatus.STAKE_TX_CONFIRMED,
      token,
      tokenId: tokenId!,
    })

  const getGas = () => ({
    amount: formatUnits(toggleFees, hemi.nativeCurrency.decimals),
    isError: isToggleFeesError,
    label: t('common.network-gas-fee', { network: hemi.name }),
    token: getNativeToken(hemi.id),
  })

  const heading = autoRelock
    ? tDrawer('disable-auto-relock.heading')
    : tDrawer('enable-auto-relock.heading')
  const subheading = autoRelock
    ? tDrawer('disable-auto-relock.subheading')
    : tDrawer('enable-auto-relock.subheading')

  const addToggleStep = function (): StepPropsWithoutPosition {
    const statusMap: Partial<
      Record<StakingDashboardStatusType, ProgressStatusType>
    > = {
      [StakingDashboardStatus.STAKE_TX_PENDING]: ProgressStatus.PROGRESS,
      [StakingDashboardStatus.STAKE_TX_FAILED]: ProgressStatus.FAILED,
      [StakingDashboardStatus.STAKE_TX_CONFIRMED]: ProgressStatus.COMPLETED,
    }

    return {
      description: (
        <ChainLabel
          active={
            stakingDashboardStatus === StakingDashboardStatus.STAKE_TX_PENDING
          }
          chainId={hemi.id}
          label={tDrawer('auto-relock.step')}
        />
      ),
      explorerChainId: token.chainId,
      status: statusMap[stakingDashboardStatus] ?? ProgressStatus.NOT_READY,
      txHash: transactionHash,
    }
  }

  const getCallToAction = function (callStatus: StakingDashboardStatusType) {
    const map: Partial<Record<StakingDashboardStatusType, ReactNode>> = {
      [StakingDashboardStatus.STAKE_TX_FAILED]: <RetryAutoRelock />,
    }
    return map[callStatus]
  }

  const { isPending: isRunningOperation, mutate: toggleAutoRelock } =
    useToggleAutoRelock({
      enable: !autoRelock,
      on(emitter) {
        emitter.on('user-signed-auto-relock', () =>
          setOperationRunning('staking'),
        )
        emitter.on('auto-relock-transaction-succeeded', function () {
          resetStateAfterOperation()
        })
        emitter.on('auto-relock-settled', () => setOperationRunning('staked'))
      },
      token,
      tokenId: tokenId!,
      updateStakingDashboardOperation,
    })

  return (
    <Operation
      callToAction={getCallToAction(stakingDashboardStatus)}
      heading={heading}
      isOperating={operationRunning !== 'idle'}
      onClose={onClose}
      preview={
        <Preview
          autoRelock={autoRelock}
          effectiveLockEnd={effectiveLockEnd!}
          gas={getGas()}
          isRunningOperation={isRunningOperation}
          onSubmit={toggleAutoRelock}
          stakedAmount={amount!}
          submitLabel={heading}
          tokenId={tokenId!}
          transferable={transferable}
        />
      }
      steps={[addToggleStep()]}
      subheading={subheading}
      token={token}
    />
  )
}
