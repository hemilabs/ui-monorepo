import { CheckCircleIcon } from 'components/icons/checkCircleIcon'
import { RedErrorIcon } from 'components/icons/redErrorIcon'
import { useTranslations } from 'next-intl'

import {
  type EarnTransactionKindType,
  type EarnTransactionStatusType,
} from '../../types'
import { InProgressIcon } from '../icons/inProgressIcon'

type Props = {
  kind: EarnTransactionKindType
  status: EarnTransactionStatusType
}

// `kind` is accepted from day one even though only deposit is wired today.
// When withdraw lands the badge gains kind-specific labels (e.g. "Cooldown",
// "Withdrawn") without churning the call sites.
export const StatusBadge = function ({ status }: Props) {
  const t = useTranslations('hemi-earn.transactions')
  if (status === 'CLAIMED') {
    return (
      <div className="flex items-center gap-x-2">
        <CheckCircleIcon className="text-neutral-400" />
        <span className="text-neutral-500">{t('status.deposited')}</span>
      </div>
    )
  }
  if (status === 'FAILED') {
    return (
      <div className="flex items-center gap-x-2">
        <RedErrorIcon />
        <span className="text-neutral-900">{t('status.tx-failed')}</span>
      </div>
    )
  }
  // PENDING / FULFILLED / CANCELLED all render as "In progress" in this PR.
  // RECOVERED is filtered upstream so it never reaches the badge.
  return (
    <div className="flex items-center gap-x-2">
      <InProgressIcon />
      <span className="text-neutral-900">{t('status.in-progress')}</span>
    </div>
  )
}
