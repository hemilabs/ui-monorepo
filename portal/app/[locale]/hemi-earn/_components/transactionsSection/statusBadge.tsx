import { CheckCircleIcon } from 'components/icons/checkCircleIcon'
import { ErrorIcon } from 'components/icons/errorIcon'
import { WarningIcon } from 'components/icons/warningIcon'
import { useTranslations } from 'next-intl'

import {
  type EarnTransactionKindType,
  type EarnTransactionStatusType,
} from '../../types'
import { InProgressIcon } from '../icons/inProgressIcon'

type Translator = ReturnType<typeof useTranslations<'hemi-earn.transactions'>>

type Props = {
  cooldownText?: string
  kind: EarnTransactionKindType
  manualClaimNeeded?: boolean
  manualRecoverNeeded?: boolean
  // The user-signed claim/recover tx reverted; surfaces as "Tx Failed" even
  // though the on-chain status is still FULFILLED/CANCELLED.
  settlementFailed?: boolean
  status: EarnTransactionStatusType
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
  // A cancelled deposit returned the original asset (the Recover CTA pulls it
  // out); a cancelled redeem is terminal.
  if (status === 'CANCELLED') {
    return kind === 'REDEEM'
      ? {
          icon: <ErrorIcon className="text-neutral-400" />,
          text: t('status.withdrawal-canceled'),
          textClassName: 'text-neutral-500',
        }
      : inProgress(t('status.returned'))
  }
  // Recovered deposits are surfaced (recovered redeems stay filtered upstream).
  if (status === 'RECOVERED') {
    return {
      icon: <CheckCircleIcon className="text-neutral-400" />,
      text: t('status.funds-returned'),
      textClassName: 'text-neutral-500',
    }
  }
  return undefined
}

function resolveBadge(
  {
    cooldownText,
    kind,
    manualClaimNeeded,
    manualRecoverNeeded,
    settlementFailed,
    status,
  }: Props,
  t: Translator,
) {
  // A reverted claim/recover wins over the (now stale) manual-needed state.
  if (settlementFailed) return failedBadge(t)
  if (manualRecoverNeeded) {
    return {
      icon: <WarningIcon className="text-amber-500" />,
      text: t('status.recover-funds-needed'),
      textClassName: 'text-neutral-900',
    }
  }
  const byStatus = resolveStatusBadge(kind, status, t)
  if (byStatus) return byStatus
  if (cooldownText !== undefined) return inProgress(cooldownText)
  return inProgress(
    t(manualClaimNeeded ? 'status.manual-claim-needed' : 'status.in-progress'),
  )
}

export const StatusBadge = function (props: Props) {
  const t = useTranslations('hemi-earn.transactions')
  const { icon, text, textClassName } = resolveBadge(props, t)
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
