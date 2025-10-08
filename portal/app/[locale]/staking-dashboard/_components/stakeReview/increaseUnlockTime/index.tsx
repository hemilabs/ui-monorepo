'use client'

import { daysToSeconds } from 'app/[locale]/staking-dashboard/_utils/lockCreationTimes'
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
  type StakingOperationRunning,
} from 'types/stakingDashboard'
import { getNativeToken } from 'utils/nativeToken'
import { formatUnits } from 'viem'

import { useStakingDashboard } from '../../../_context/stakingDashboardContext'
import { useEstimateIncreaseUnlockTimeFees } from '../../../_hooks/useEstimateIncreaseUnlockTimeFees'
import { useIncreaseUnlockTime } from '../../../_hooks/useIncreaseUnlockTime'
import { isValidLockup } from '../../lockup'

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
        Record<StakingDashboardStatus, ProgressStatusType>
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

  const getCallToAction = function (callStatus: StakingDashboardStatus) {
    const map: Partial<Record<StakingDashboardStatus, ReactNode>> = {
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

  // TODO: This UX/UI will be improved in future iterations.
  // For now, we are just adding the step value to the current lockupDays
  // So this validation will be replaced soon
  function checkLockupIsGreater() {
    if (
      stakingPosition?.lockTime !== undefined &&
      stakingPosition?.timestamp !== undefined
    ) {
      const currentTimestamp = BigInt(Math.floor(Date.now() / 1000))
      const SIX_DAYS = BigInt(6 * 24 * 60 * 60)

      // Calculate the current unlock time by adding duration to start time.
      // The contract stores unlock times rounded down to 6-day increments,
      // so we round it here to match the on-chain value.
      const currentEnd =
        BigInt(stakingPosition.timestamp) + BigInt(stakingPosition.lockTime)
      const roundedCurrentEnd = (currentEnd / SIX_DAYS) * SIX_DAYS

      // Calculate the new unlock time from the user's input.
      // The contract adds the duration to the current timestamp and rounds down,
      // so we replicate that logic here.
      const rawUnlockTime =
        currentTimestamp + daysToSeconds(BigInt(lockupDays!))
      const newUnlockTime = (rawUnlockTime / SIX_DAYS) * SIX_DAYS

      // The contract requires the new unlock time to be strictly greater than
      // the current one. This allows extending positions close to expiry with
      // any duration that results in a longer lock.
      if (newUnlockTime <= roundedCurrentEnd) {
        return tDrawer('increase-unlock-time.lockup-period-longer')
      }
    }

    return undefined
  }

  const isValid =
    isValidLockup(lockupDays!) && checkLockupIsGreater() === undefined

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
        validationError={checkLockupIsGreater()}
      />
    </>
  )
}
