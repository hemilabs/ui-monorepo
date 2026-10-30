import { useLocale } from 'use-intl'
import { formatDuration } from 'utils/duration'
import { type Address } from 'viem'

import { findVaultMetadata } from '../_utils/vaults'

const maxTransferTimeFactor = 2

export const useVaultMetadata = function (stakingVault: Address) {
  const locale = useLocale()
  const metadata = findVaultMetadata(stakingVault)
  return metadata
    ? {
        maxDuration: formatDuration(
          metadata.typicalTransferTime * maxTransferTimeFactor,
          locale,
        ),
        operator: metadata.operator,
        typicalDuration: formatDuration(metadata.typicalTransferTime, locale),
      }
    : undefined
}
