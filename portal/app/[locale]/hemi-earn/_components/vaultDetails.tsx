import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'use-intl'
import { type Address } from 'viem'

import { findVaultMetadata, getVaultDetails } from '../_utils/vaults'

type Props = {
  stakingVault: Address
  truncate?: boolean
}

export const VaultDetails = function ({
  stakingVault,
  truncate = false,
}: Props) {
  const t = useTranslations('hemi-earn.vault-info')
  const metadata = findVaultMetadata(stakingVault)

  if (!metadata) {
    return null
  }

  const { curators, operator } = getVaultDetails(metadata)
  const text = [
    t('operator', { operator }),
    curators && t('curators', curators),
  ]
    .filter(Boolean)
    .join(' · ')

  if (!truncate) {
    return <p className="body-text-normal text-neutral-600">{text}</p>
  }

  return (
    <Tooltip text={text} variant="simple">
      <button
        className="body-text-normal w-full truncate text-left text-neutral-600"
        type="button"
      >
        {text}
      </button>
    </Tooltip>
  )
}
