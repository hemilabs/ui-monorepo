import { DrawerParagraph } from 'components/drawer'
import { useTranslations } from 'use-intl'
import { type Address } from 'viem'

import { VaultDetailsLink } from './vaultDetailsLink'

type Props = {
  operation: 'deposit' | 'withdraw'
  shareAddress: Address
  vaultMetadata: { duration: string; operator: string } | undefined
  vaultName: string
}

export const ReviewIntro = function ({
  operation,
  shareAddress,
  vaultMetadata,
  vaultName,
}: Props) {
  const t = useTranslations('hemi-earn.vault.drawer')

  const getText = function () {
    if (vaultMetadata === undefined) {
      return t('review-fallback')
    }
    const { duration, operator } = vaultMetadata
    return operation === 'withdraw'
      ? t('withdraw.review', { operator, vaultName })
      : t('deposit.review', { duration, operator, vaultName })
  }

  return (
    <div className="flex flex-col gap-y-2">
      <DrawerParagraph>{getText()}</DrawerParagraph>
      <VaultDetailsLink shareAddress={shareAddress} />
    </div>
  )
}
