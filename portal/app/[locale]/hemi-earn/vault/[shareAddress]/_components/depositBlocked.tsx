import { Button } from 'components/button'
import { ExternalLink } from 'components/externalLink'
import { WarningBox } from 'components/warningBox'
import { type ReactNode } from 'react'
import { useTranslations } from 'use-intl'

import { vetroSupportUrl } from '../../../_constants/vetro'
import { useIsSanctioned } from '../../../_hooks/useIsSanctioned'
import {
  type DepositBlockReason,
  depositBlockMessageKey,
} from '../../../_utils/depositGate'

const supportLink = (chunks: ReactNode) => (
  <ExternalLink
    className="hoverable-text font-medium underline"
    href={vetroSupportUrl}
  >
    {chunks}
  </ExternalLink>
)

const ScreeningUnavailable = function () {
  const t = useTranslations('common')
  const { isFetching, refetch } = useIsSanctioned()

  return (
    <WarningBox subheading={t('unexpected-error')}>
      <div className="mt-2 flex">
        <Button
          disabled={isFetching}
          onClick={() => refetch()}
          size="xSmall"
          type="button"
          variant="secondary"
        >
          {t('try-again')}
        </Button>
      </div>
    </WarningBox>
  )
}

export const DepositBlocked = function ({
  reason,
}: {
  reason: DepositBlockReason
}) {
  const t = useTranslations()

  if (reason === 'restricted-location' || reason === 'sanctioned-wallet') {
    return (
      <WarningBox
        heading={t(`hemi-earn.blocked.${reason}.heading`)}
        subheading={t.rich(`hemi-earn.blocked.${reason}.body`, {
          link: supportLink,
        })}
      />
    )
  }
  if (reason === 'screening-unavailable') {
    return <ScreeningUnavailable />
  }
  return <WarningBox subheading={t(depositBlockMessageKey(reason))} />
}
