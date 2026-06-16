import { CheckCircleIcon } from 'components/icons/checkCircleIcon'
import { ErrorIcon } from 'components/icons/errorIcon'
import { useTranslations } from 'next-intl'

import {
  type EarnTransactionKindType,
  type EarnTransactionStatusType,
} from '../../types'
import { InProgressIcon } from '../icons/inProgressIcon'

type Props = {
  cooldownText?: string
  kind: EarnTransactionKindType
  status: EarnTransactionStatusType
}

export const StatusBadge = function ({ cooldownText, kind, status }: Props) {
  const t = useTranslations('hemi-earn.transactions')
  if (status === 'FINALIZED') {
    return (
      <div className="flex items-center gap-x-2">
        <CheckCircleIcon className="text-neutral-400" />
        <span className="text-neutral-500">
          {kind === 'REDEEM' ? t('status.withdrawn') : t('status.deposited')}
        </span>
      </div>
    )
  }
  if (status === 'FAILED') {
    return (
      <div className="flex items-center gap-x-2">
        <ErrorIcon className="text-rose-500" />
        <span className="text-neutral-900">{t('status.tx-failed')}</span>
      </div>
    )
  }
  if (status === 'CANCELLED' && kind === 'REDEEM') {
    return (
      <div className="flex items-center gap-x-2">
        <ErrorIcon className="text-neutral-400" />
        <span className="text-neutral-500">
          {t('status.withdrawal-canceled')}
        </span>
      </div>
    )
  }
  if (cooldownText !== undefined) {
    return (
      <div className="flex items-center gap-x-2">
        <InProgressIcon />
        <span className="text-neutral-900">{cooldownText}</span>
      </div>
    )
  }
  // RECOVERED is filtered upstream so it never reaches the badge.
  return (
    <div className="flex items-center gap-x-2">
      <InProgressIcon />
      <span className="text-neutral-900">{t('status.in-progress')}</span>
    </div>
  )
}
