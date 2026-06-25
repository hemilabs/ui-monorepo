import { CheckCircleIcon } from 'components/icons/checkCircleIcon'
import { ErrorIcon } from 'components/icons/errorIcon'
import { WarningIcon } from 'components/icons/warningIcon'
import { useTranslations } from 'next-intl'

import {
  hasFailedSettlement,
  isUserCancel,
  needsManualClaim,
  needsRecover,
} from '../../_utils'
import {
  type EarnTransaction,
  type EarnTransactionKindType,
  type EarnTransactionStatusType,
} from '../../types'
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

function resolveStatusBadge(
  kind: EarnTransactionKindType,
  status: EarnTransactionStatusType,
  t: Translator,
) {
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
  // A cancelled request (deposit or redeem) is mid-recover: the original tokens
  // are coming back (auto-recover) or await the Recover CTA — never terminal.
  if (status === 'CANCELLED') {
    return inProgress(t('status.returned'))
  }
  // Recovered: the deposit's asset / the redeem's shares are back in the wallet.
  if (status === 'RECOVERED') {
    return {
      icon: <CheckCircleIcon className="text-neutral-400" />,
      text:
        kind === 'REDEEM'
          ? t('status.shares-returned')
          : t('status.funds-returned'),
      textClassName: 'text-neutral-500',
    }
  }
  return undefined
}

function resolveBadge(
  transaction: EarnTransaction,
  cooldownText: string | undefined,
  t: Translator,
) {
  const { kind, status } = transaction
  // A reverted claim/recover wins over the (now stale) manual-needed state.
  if (hasFailedSettlement(transaction)) return failedBadge(t)
  const userCancel = isUserCancel(transaction)
  // Once it rests at CANCELLED it's the recover stage — neutral for a user
  // cancel, amber for an Agent failure. Only the still-processing PENDING cancel
  // reads as the passive "Cancelling withdrawal".
  if (needsRecover(transaction)) return recoverBadge(userCancel, kind, t)
  if (userCancel) return inProgress(t('status.cancelling'))
  const byStatus = resolveStatusBadge(kind, status, t)
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
  const { icon, text, textClassName } = resolveBadge(
    transaction,
    cooldownText,
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
