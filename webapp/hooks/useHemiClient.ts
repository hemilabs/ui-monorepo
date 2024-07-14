import { hemi } from 'app/networks'
import {
  hemiPublicBitcoinKitActions,
  hemiPublicBitcoinTunnelManagerActions,
  hemiPublicBitcoinVaultActions,
} from 'hemi-viem'
import { useMemo } from 'react'
import { type Chain } from 'viem'
import { usePublicClient } from 'wagmi'

export const useHemiClient = function (chainId: Chain['id'] = hemi.id) {
  const hemiClient = usePublicClient({ chainId })
  return useMemo(
    () =>
      hemiClient
        .extend(hemiPublicBitcoinKitActions())
        .extend(hemiPublicBitcoinVaultActions())
        .extend(hemiPublicBitcoinTunnelManagerActions()),
    [hemiClient],
  )
}

// I wish there was a better way to infer this type, so it wouldn't depend on the hook
export type HemiPublicClient = ReturnType<typeof useHemiClient>
