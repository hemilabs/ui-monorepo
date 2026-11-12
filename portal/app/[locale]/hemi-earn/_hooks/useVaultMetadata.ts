import { useMemo } from 'react'
import { useLocale } from 'use-intl'
import { formatDuration } from 'utils/duration'
import { type Address } from 'viem'

import { findVaultMetadata } from '../_utils/vaults'

const maxTransferTimeFactor = 2

export const useVaultMetadata = function (stakingVault: Address) {
  const locale = useLocale()
  return useMemo(
    function () {
      const metadata = findVaultMetadata(stakingVault)
      if (!metadata) return undefined
      const maxTransferSeconds =
        metadata.typicalTransferTime * maxTransferTimeFactor
      return {
        apyIncludesFees: metadata.apyIncludesFees,
        maxDuration: formatDuration(maxTransferSeconds, locale),
        maxTransferSeconds,
        operator: metadata.operator,
        typicalDuration: formatDuration(metadata.typicalTransferTime, locale),
      }
    },
    [locale, stakingVault],
  )
}
