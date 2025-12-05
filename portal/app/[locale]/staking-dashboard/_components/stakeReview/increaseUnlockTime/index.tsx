'use client'

import { DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { ChainLabel } from 'components/reviewOperation/chainLabel'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'next-intl'
import { ReactNode, useState } from 'react'
import {
  StakingDashboardStatus,
  type StakingDashboardStatusType,
  type StakingOperationRunning,
} from 'types/stakingDashboard'
import { getNativeToken } from 'utils/nativeToken'
import { unixNowTimestamp } from 'utils/time'
import { formatUnits } from 'viem'

import { minDays } from '../../../../staking-dashboard/_utils/lockCreationTimes'
import { useStakingDashboard } from '../../../_context/stakingDashboardContext'
import { useEstimateIncreaseUnlockTimeFees } from '../../../_hooks/useEstimateIncreaseUnlockTimeFees'
import { useIncreaseUnlockTime } from '../../../_hooks/useIncreaseUnlockTime'
import { getNearestValidValues, isValidLockup } from '../../lockup'

import { Preview } from './preview'
import { RetryIncreaseUnlockTime } from './retryIncreaseUnlockTime'

type Props = {
  onClose: VoidFunction
}

export const ReviewIncreaseUnlockTime = function ({ onClose }: Props) {
  const {
    resetStateAfterOperation,
    stakingDashboardOperation,
    updateStakingDashboardOperation,
  } = useStakingDashboard()
  const token = useHemiToken()

  const [operationRunning, setOperationRunning] =
    useState<StakingOperationRunning>('idle')

  // stakingDashboardOperation and stakingPosition will always be defined here
  const { input, inputDays, lockupDays, stakingPosition, transactionHash } =
    stakingDashboardOperation!
  const { tokenId } = stakingPosition!

  const stakingDashboardStatus =
    stakingDashboardOperation?.status ?? StakingDashboardStatus.STAKE_TX_PENDING

  const t = useTranslations()
  const tDrawer = useTranslations('staking-dashboard.drawer')
  const hemi = useHemi()

  const {
    fees: increaseUnlockTimeFees,
    isError: isIncreaseUnlockTimeFeesError,
  } = useEstimateIncreaseUnlockTimeFees({
    lockupDays: lockupDays!,
    token,
    tokenId: BigInt(tokenId!),
  })

  const getGas = () => ({
    amount: formatUnits(increaseUnlockTimeFees, hemi.nativeCurrency.decimals),
    isError: isIncreaseUnlockTimeFeesError,
    label: t('common.network-gas-fee', { network: hemi.name }),
    token: getNativeToken(hemi.id),
  })

  const getStepFees = ({
    fee,
    isError,
    show,
  }: {
    fee: bigint
    show: boolean
    isError: boolean
  }): StepPropsWithoutPosition['fees'] =>
    show
      ? {
          amount: formatUnits(fee, hemi.nativeCurrency.decimals),
          isError,
          token: getNativeToken(hemi.id),
        }
      : undefined

  const addIncreaseUnlockTimeStep = function (): StepPropsWithoutPosition {
    const getStatus = function () {
      if (stakingDashboardStatus === undefined) {
        return ProgressStatus.NOT_READY
      }
      const statusMap: Partial<
        Record<StakingDashboardStatusType, ProgressStatusType>
      > = {
        [StakingDashboardStatus.STAKE_TX_PENDING]: ProgressStatus.PROGRESS,
        [StakingDashboardStatus.STAKE_TX_FAILED]: ProgressStatus.FAILED,
        [StakingDashboardStatus.STAKE_TX_CONFIRMED]: ProgressStatus.COMPLETED,
      }
      return statusMap[stakingDashboardStatus] ?? ProgressStatus.NOT_READY
    }

    const showFees = [
      StakingDashboardStatus.APPROVAL_TX_COMPLETED,
      StakingDashboardStatus.STAKE_TX_PENDING,
      StakingDashboardStatus.STAKE_TX_FAILED,
    ].includes(stakingDashboardStatus)

    return {
      description: (
        <ChainLabel
          active={
            stakingDashboardStatus === StakingDashboardStatus.STAKE_TX_PENDING
          }
          chainId={hemi.id}
          label={tDrawer('stake-token', {
            symbol: token.symbol,
          })}
        />
      ),
      explorerChainId: token.chainId,
      fees: getStepFees({
        fee: increaseUnlockTimeFees,
        isError: isIncreaseUnlockTimeFeesError,
        show: showFees,
      }),
      status: getStatus(),
      txHash: transactionHash,
    }
  }

  const getSteps = () => [addIncreaseUnlockTimeStep()]

  const getCallToAction = function (callStatus: StakingDashboardStatusType) {
    const map: Partial<Record<StakingDashboardStatusType, ReactNode>> = {
      [StakingDashboardStatus.APPROVAL_TX_FAILED]: <RetryIncreaseUnlockTime />,
      [StakingDashboardStatus.STAKE_TX_FAILED]: <RetryIncreaseUnlockTime />,
    }
    return map[callStatus]
  }

  const { isPending: isRunningOperation, mutate: increaseUnlockTime } =
    useIncreaseUnlockTime({
      lockupDays: lockupDays!,
      on(emitter) {
        emitter.on('user-signed-increase-unlock-time', () =>
          setOperationRunning('staking'),
        )
        emitter.on('increase-unlock-time-transaction-succeeded', function () {
          resetStateAfterOperation()
        })
        emitter.on('increase-unlock-time-settled', () =>
          setOperationRunning('staked'),
        )
      },
      token,
      tokenId: tokenId!,
      updateStakingDashboardOperation,
    })

  const calculateCurrentLockupDays = function () {
    if (
      stakingPosition?.lockTime !== undefined &&
      stakingPosition?.timestamp !== undefined
    ) {
      const currentTimestamp = unixNowTimestamp()
      const sixDays = BigInt(6 * 24 * 60 * 60)
      const secondsPerDay = BigInt(24 * 60 * 60)

      // Calculate the current unlock time
      const currentEnd =
        BigInt(stakingPosition.timestamp) + BigInt(stakingPosition.lockTime)
      const roundedCurrentEnd = (currentEnd / sixDays) * sixDays

      // Calculate how many days from now until unlock
      const secondsRemaining = roundedCurrentEnd - currentTimestamp
      const daysFromNow = Number(secondsRemaining / secondsPerDay)

      // Round to match the minimum days (12 days)
      return Math.max(0, Math.round(daysFromNow)) + minDays
    }

    return undefined
  }

  const currentLockupDays = calculateCurrentLockupDays()
  const nearest = getNearestValidValues({
    minLocked: currentLockupDays,
    value: currentLockupDays ?? minDays,
  })

  const isValid = isValidLockup({
    minLocked: currentLockupDays,
    value: lockupDays!,
  })

  return (
    <>
      <div className="min-h-21 mb-3 flex flex-col gap-y-3">
        <DrawerTopSection
          heading={tDrawer('increase-unlock-time.heading', {
            symbol: token.symbol,
          })}
          onClose={onClose}
        />
        <DrawerParagraph>
          {tDrawer('increase-unlock-time.subheading', { symbol: token.symbol })}
        </DrawerParagraph>
      </div>
      <Preview
        callToAction={getCallToAction(stakingDashboardStatus)}
        gas={getGas()}
        input={input!}
        inputDays={inputDays!}
        isRunningOperation={isRunningOperation}
        isValid={isValid}
        lockupDays={lockupDays!}
        minLocked={nearest ? nearest.maxValue! : undefined}
        onSubmit={increaseUnlockTime}
        onUpdateInputDays={function (value) {
          updateStakingDashboardOperation({
            inputDays: value,
          })
        }}
        onUpdateLockupDays={function (value) {
          updateStakingDashboardOperation({
            lockupDays: value,
          })
        }}
        operationRunning={operationRunning}
        steps={getSteps()}
      />
    </>
  )
}
