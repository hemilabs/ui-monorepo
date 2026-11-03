import { DrawerParagraph } from 'components/drawer'
import { useTranslations } from 'use-intl'
import { type Address } from 'viem'

import { VaultDetailsLink } from './vaultDetailsLink'

type Props = {
  operation: 'deposit' | 'withdraw'
  shareAddress: Address
  vaultMetadata: { maxDuration: string } | undefined
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
    const { maxDuration } = vaultMetadata
    return operation === 'withdraw'
      ? t('withdraw.review', { vaultName })
      : t('deposit.review', { duration: maxDuration, vaultName })
  }

  return (
    <div className="flex flex-col gap-y-2">
      <DrawerParagraph>{getText()}</DrawerParagraph>
      <VaultDetailsLink shareAddress={shareAddress} />
    </div>
  )
}
