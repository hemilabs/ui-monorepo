import { useLocale } from 'use-intl'
import { formatDuration } from 'utils/duration'
import { type Address } from 'viem'

import { findVaultMetadata } from '../_utils/vaults'

export const useVaultMetadata = function (stakingVault: Address) {
  const locale = useLocale()
  const metadata = findVaultMetadata(stakingVault)
  return metadata
    ? {
        duration: formatDuration(metadata.typicalTransferTime, locale),
        operator: metadata.operator,
      }
    : undefined
}
