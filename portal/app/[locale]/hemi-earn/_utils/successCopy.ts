import { type useTranslations } from 'use-intl'

import { type EarnTransactionKindType } from '../types'

export const completedCopy = function ({
  kind,
  operator,
  t,
  vaultName,
}: {
  kind: EarnTransactionKindType
  operator?: string
  t: ReturnType<typeof useTranslations<'hemi-earn.vault'>>
  vaultName?: string
}) {
  if (kind === 'REDEEM') {
    return t('withdraw-complete')
  }
  return operator !== undefined && vaultName !== undefined
    ? t('deposit-complete', { operator, vaultName })
    : t('deposit-complete-plain')
}

export const completedSubheading = ({
  fallback,
  isCompleted,
  kind,
  operator,
  t,
  vaultName,
}: {
  fallback: string
  isCompleted: boolean
  kind: EarnTransactionKindType
  operator?: string
  t: ReturnType<typeof useTranslations<'hemi-earn.vault'>>
  vaultName?: string
}) => (isCompleted ? completedCopy({ kind, operator, t, vaultName }) : fallback)
