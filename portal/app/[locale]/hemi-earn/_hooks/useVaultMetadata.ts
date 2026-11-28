import { useFormat } from 'hooks/useFormat'
import { useMemo } from 'react'
import { type Address } from 'viem'

import { findVaultMetadata } from '../_utils/vaults'

const maxTransferTimeFactor = 2

export const useVaultMetadata = function (stakingVault: Address) {
  const { formatDuration } = useFormat()
  return useMemo(
    function () {
      const metadata = findVaultMetadata(stakingVault)
      if (!metadata) return undefined
      const maxTransferSeconds =
        metadata.typicalTransferTime * maxTransferTimeFactor
      return {
        apyIncludesFees: metadata.apyIncludesFees,
        maxDuration: formatDuration(maxTransferSeconds),
        maxTransferSeconds,
        operator: metadata.operator,
        typicalDuration: formatDuration(metadata.typicalTransferTime),
      }
    },
    [formatDuration, stakingVault],
  )
}
