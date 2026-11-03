import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { type useTranslations } from 'use-intl'

import { type EarnTransaction } from '../types'

import {
  isDeliberateCancel,
  isLocalEarnTransactionRow,
  isRecoverPath,
} from './transactionPredicates'

export const isCrossingNetworks = ({
  isAwaitingCooldown = false,
  isRemoteFail,
  isSettlingLocally,
  isStepInProgress,
}: {
  isAwaitingCooldown?: boolean
  isRemoteFail: boolean
  isSettlingLocally: boolean
  isStepInProgress: boolean
}) =>
  isStepInProgress && !isRemoteFail && !isSettlingLocally && !isAwaitingCooldown

export const transferDeadline = function ({
  maxTransferSeconds,
  processedAt,
  requestedAt,
}: {
  maxTransferSeconds: number | undefined
  processedAt?: string | null
  requestedAt: string | undefined
}) {
  if (maxTransferSeconds === undefined) {
    return undefined
  }
  const startedAt = Number(processedAt ?? requestedAt)
  return Number.isFinite(startedAt) && startedAt > 0
    ? startedAt + maxTransferSeconds
    : undefined
}

export const isTransferDelayed = ({
  isCrossing,
  secondsRemaining,
  transaction,
}: {
  isCrossing: boolean
  secondsRemaining: number | undefined
  transaction: EarnTransaction
}) =>
  isCrossing &&
  secondsRemaining === 0 &&
  !isLocalEarnTransactionRow(transaction) &&
  !isRecoverPath(transaction) &&
  !isDeliberateCancel(transaction)

export const inTransitPostAction = ({
  duration,
  isCrossing,
  t,
}: {
  duration: string | undefined
  isCrossing: boolean
  t: ReturnType<typeof useTranslations<'hemi-earn.vault.drawer'>>
}) =>
  isCrossing && duration !== undefined
    ? {
        description: t('in-transit', { duration }),
        status: ProgressStatus.NOT_READY,
      }
    : undefined
