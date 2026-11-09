import { ExternalLink } from 'components/externalLink'
import { WarningBox } from 'components/warningBox'
import { type ReactNode } from 'react'
import { useTranslations } from 'use-intl'

import { vetroSupportUrl } from '../../../_constants/vetro'
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
  return <WarningBox subheading={t(depositBlockMessageKey(reason))} />
}
