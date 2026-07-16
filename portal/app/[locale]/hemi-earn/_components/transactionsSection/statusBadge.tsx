import { CheckCircleIcon } from 'components/icons/checkCircleIcon'
import { ErrorIcon } from 'components/icons/errorIcon'
import { ReturnCircleIcon } from 'components/icons/returnCircleIcon'
import { WarningIcon } from 'components/icons/warningIcon'
import { useTranslations } from 'next-intl'

import { useRemoteFailedState } from '../../_hooks/useRemoteFailedState'
import {
  hasFailedSettlement,
  isDeliberateCancel,
  isRemoteFailed,
  isUserCancel,
  needsManualClaim,
  needsRecover,
  remoteFailedSettlement,
} from '../../_utils'
import { decodeFailureReason } from '../../_utils/decodeFailureReason'
import { type EarnTransaction, type EarnTransactionKindType } from '../../types'
import { InProgressIcon } from '../icons/inProgressIcon'

type Translator = ReturnType<typeof useTranslations<'hemi-earn.transactions'>>

type Props = {
  cooldownText?: string
  transaction: EarnTransaction
}

const inProgress = (text: string) => ({
  icon: <InProgressIcon />,
  text,
  textClassName: 'text-neutral-900',
})

const failedBadge = (t: Translator) => ({
  icon: <ErrorIcon className="text-rose-500" />,
  text: t('status.tx-failed'),
  textClassName: 'text-neutral-900',
})

// Amber (not the red Tx Failed): the request is recoverable, the user just needs to Retry/Cancel.
const actionNeededBadge = (t: Translator) => ({
  icon: <WarningIcon className="text-amber-500" />,
  text: t('status.action-needed'),
  textClassName: 'text-neutral-900',
})

// Slippage names the cause instead of the generic "Action needed": a retry can't fix it, only Cancel.
const slippageBadge = (t: Translator) => ({
  icon: <WarningIcon className="text-amber-500" />,
  text: t('status.slippage-exceeded'),
  textClassName: 'text-neutral-900',
})

// An in-flight retry/cancel reads as progress; a stuck remote failure asks the user to act.
// Only drives the badge while still FAILED — once the row advances (FULFILLED/CANCELLED after a
// successful retry/cancel) the lingering marker must hand back to the normal claim/recover badge.
function remoteBadge(
  transaction: EarnTransaction,
  ready: boolean,
  t: Translator,
) {
  if (!isRemoteFailed(transaction)) return undefined
  const marker = remoteFailedSettlement(transaction.settlement)
  if (marker && !marker.failed) {
    const returningKey =
      transaction.kind === 'DEPOSIT'
        ? 'status.returning-funds'
        : 'status.returning-share-tokens'
    return inProgress(
      t(marker.kind === 'RETRY' ? 'status.retrying' : returningKey),
    )
  }
  // Within the keeper grace the CTA is hidden, so read as in-progress, not "Action needed".
  if (!ready) return inProgress(t('status.in-progress'))
  return decodeFailureReason(transaction.failureReason) === 'slippage'
    ? slippageBadge(t)
    : actionNeededBadge(t)
}

const recoverBadge = (
  userCancel: boolean,
  kind: EarnTransactionKindType,
  t: Translator,
) =>
  userCancel
    ? inProgress(t('status.recover-shares-cancelled'))
    : {
        icon: <WarningIcon className="text-amber-500" />,
        text:
          kind === 'REDEEM'
            ? t('status.recover-shares-needed')
            : t('status.recover-funds-needed'),
        textClassName: 'text-neutral-900',
      }

function resolveRecoveredText(transaction: EarnTransaction, t: Translator) {
  if (transaction.kind !== 'REDEEM') return t('status.funds-returned')
  return isDeliberateCancel(transaction)
    ? t('status.shares-returned-cancelled')
    : t('status.shares-returned')
}

function resolveStatusBadge(transaction: EarnTransaction, t: Translator) {
  const { kind, status } = transaction
  if (status === 'FINALIZED') {
    return {
      icon: <CheckCircleIcon className="text-neutral-400" />,
      text: kind === 'REDEEM' ? t('status.withdrawn') : t('status.deposited'),
      textClassName: 'text-neutral-500',
    }
  }
  if (status === 'FAILED') {
    return failedBadge(t)
  }
  // CANCELLED is mid-recover (auto-recover or awaiting the Recover CTA), never terminal.
  if (status === 'CANCELLED') {
    return inProgress(t('status.returned'))
  }
  if (status === 'RECOVERED') {
    return {
      icon: <ReturnCircleIcon className="text-neutral-400" />,
      text: resolveRecoveredText(transaction, t),
      textClassName: 'text-neutral-500',
    }
  }
  return undefined
}

function resolveBadge(
  transaction: EarnTransaction,
  cooldownText: string | undefined,
  remoteFailedReady: boolean,
  t: Translator,
) {
  const { kind } = transaction
  // A reverted claim/recover wins over the (now stale) manual-needed state.
  if (hasFailedSettlement(transaction)) return failedBadge(t)
  const remote = remoteBadge(transaction, remoteFailedReady, t)
  if (remote) return remote
  const userCancel = isUserCancel(transaction)
  // At CANCELLED it's the recover stage — neutral for a user cancel, amber for an Agent failure; the PENDING cancel reads as "Cancelling".
  if (needsRecover(transaction)) return recoverBadge(userCancel, kind, t)
  if (userCancel) return inProgress(t('status.cancelling'))
  const byStatus = resolveStatusBadge(transaction, t)
  if (byStatus) return byStatus
  if (cooldownText !== undefined) return inProgress(cooldownText)
  return inProgress(
    t(
      needsManualClaim(transaction)
        ? 'status.manual-claim-needed'
        : 'status.in-progress',
    ),
  )
}

export const StatusBadge = function ({ cooldownText, transaction }: Props) {
  const t = useTranslations('hemi-earn.transactions')
  const { show: remoteFailedReady } = useRemoteFailedState(transaction)
  const { icon, text, textClassName } = resolveBadge(
    transaction,
    cooldownText,
    remoteFailedReady,
    t,
  )
  return (
    <div className="flex min-w-0 items-center gap-x-2">
      <span className="flex shrink-0">{icon}</span>
      <span
        className={`min-w-0 whitespace-normal leading-tight ${textClassName}`}
      >
        {text}
      </span>
    </div>
  )
}
