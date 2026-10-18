import { useQueryClient } from '@tanstack/react-query'
import { DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { ChainLabel } from 'components/reviewOperation/chainLabel'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { ReactNode, useRef, useState } from 'react'
import {
  StakingDashboardStatus,
  type StakingDashboardStatusType,
  type StakingOperationRunning,
} from 'types/stakingDashboard'
import { useLocale, useTranslations } from 'use-intl'
import { formatDate } from 'utils/format'
import { getNativeToken } from 'utils/nativeToken'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useStakingDashboard } from '../../../_context/stakingDashboardContext'
import { useEstimateIncreaseUnlockTimeFees } from '../../../_hooks/useEstimateIncreaseUnlockTimeFees'
import { useIncreaseUnlockTime } from '../../../_hooks/useIncreaseUnlockTime'
import {
  getStakingPositionsQueryKey,
  useStakingPositions,
} from '../../../_hooks/useStakingPositions'
import {
  createValidationFailureTracker,
  getExtendLockupState,
} from '../../../_utils/extendLockupState'
import { minDays } from '../../../_utils/lockCreationTimes'
import { getLockupErrorMessage } from '../../../_utils/lockupError'
import { isTransientLockFailure } from '../../../_utils/lockupValidationFailure'
import { isValidLockup } from '../../lockup'

import { Preview } from './preview'
import { RetryIncreaseUnlockTime } from './retryIncreaseUnlockTime'

type Props = {
  onClose: VoidFunction
}

type LiveExtendStateInput = {
  lockTime: bigint | number | undefined
  timestamp: bigint | number | undefined
  tokenId: bigint | number | string | undefined
}

// The drawer reads the lock end for its tokenId from the positions query instead of the
// copy taken when the row was clicked: if the lock changed on chain while open, the copy's
// minimum is wrong and retrying fails forever (#2474). Falls back to the copy while loading.
const useLiveExtendState = function ({
  lockTime,
  timestamp,
  tokenId,
}: LiveExtendStateInput) {
  const positionsQuery = useStakingPositions()
  const freshPosition =
    tokenId === undefined
      ? undefined
      : positionsQuery.data?.find(
          position => position.tokenId === BigInt(tokenId),
        )
  const liveLockTime = freshPosition?.lockTime ?? lockTime
  const liveTimestamp = freshPosition?.timestamp ?? timestamp
  if (liveLockTime === undefined || liveTimestamp === undefined) {
    return { canExtend: true, extendState: null, minLocked: minDays }
  }
  const extendState = getExtendLockupState({
    lockTime: liveLockTime,
    timestamp: liveTimestamp,
  })
  return {
    canExtend: extendState.canExtend,
    extendState,
    minLocked: extendState.canExtend ? extendState.minLocked : undefined,
  }
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
  const validationTrackerRef = useRef(createValidationFailureTracker())

  // stakingDashboardOperation and stakingPosition will always be defined here
  const { input, inputDays, lockupDays, stakingPosition, transactionHash } =
    stakingDashboardOperation!
  const { lockTime, timestamp, tokenId } = stakingPosition!

  const { address } = useAccount()
  const queryClient = useQueryClient()
  const locale = useLocale()
  const { canExtend, extendState, minLocked } = useLiveExtendState({
    lockTime,
    timestamp,
    tokenId,
  })

  const stakingDashboardStatus =
    stakingDashboardOperation?.status ?? StakingDashboardStatus.STAKE_TX_PENDING

  const t = useTranslations()
  const tDrawer = useTranslations('hemi-stake.drawer')
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

  const handleFailedValidation = function () {
    // Shared with the retry step: a validation failure means stale data, so
    // refresh the positions and send the main drawer back to the form (#2474).
    validationTrackerRef.current.markValidationFailed()
    queryClient.invalidateQueries({
      queryKey: getStakingPositionsQueryKey({
        address,
        chainId: hemi.id,
      }),
    })
    setOperationRunning('idle')
  }

  const getCallToAction = function (callStatus: StakingDashboardStatusType) {
    const map: Partial<Record<StakingDashboardStatusType, ReactNode>> = {
      [StakingDashboardStatus.APPROVAL_TX_FAILED]: (
        <RetryIncreaseUnlockTime onFailedValidation={handleFailedValidation} />
      ),
      [StakingDashboardStatus.STAKE_TX_FAILED]: (
        <RetryIncreaseUnlockTime onFailedValidation={handleFailedValidation} />
      ),
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
        emitter.on('increase-unlock-time-failed-validation', function (reason) {
          // The snapshot went stale (e.g. extended elsewhere): refresh the positions
          // and send the user back to the form with a recomputed minimum (#2474).
          // A lock status that couldn't be read is a hiccup, not stale data: the
          // failed step with Retry stays, instead of a click that looks like a no-op.
          if (!isTransientLockFailure(reason)) {
            handleFailedValidation()
          }
        })
        emitter.on('increase-unlock-time-transaction-succeeded', function () {
          resetStateAfterOperation()
        })
        emitter.on('increase-unlock-time-settled', function () {
          // Settled always fires, even after failed-validation: don't let it overwrite
          // the back-to-form idle with staked (#2474).
          if (validationTrackerRef.current.consumeSettled()) {
            return
          }
          setOperationRunning('staked')
        })
      },
      token,
      tokenId: tokenId!,
      updateStakingDashboardOperation,
    })

  const handleSubmit = function () {
    // A fresh submit clears any stale validation flag (e.g. set from a retry
    // whose own settled never reaches this drawer), so its settled lands (#2474).
    validationTrackerRef.current.reset()
    increaseUnlockTime()
  }

  const isValid = canExtend && isValidLockup({ minLocked, value: lockupDays! })

  const lockupError = getLockupErrorMessage({ minLocked, value: lockupDays! })
  // When the position cannot be extended yet there is no minimum to meet: name the date
  // and disable submit instead of falling back to a 1461-day minimum (#2474).
  const validationError =
    extendState && !extendState.canExtend
      ? t('hemi-stake.table.add-time-available-on', {
          date: formatDate(
            new Date(extendState.extensionAvailableAt * 1000),
            locale,
          ),
        })
      : lockupError && t(lockupError.key, lockupError.values)

  return (
    <>
      <div className="mb-3 flex min-h-21 flex-col gap-y-3">
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
        minLocked={minLocked}
        onSubmit={handleSubmit}
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
        validationError={validationError}
      />
    </>
  )
}
