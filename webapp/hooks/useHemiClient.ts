import { hemi } from 'app/networks'
import {
  hemiPublicBitcoinKitActions,
  hemiPublicBitcoinTunnelManagerActions,
  hemiPublicBitcoinVaultActions,
} from 'hemi-viem'
import { useMemo } from 'react'
import { type Address, type Chain } from 'viem'
import { usePublicClient } from 'wagmi'

const localExtensions = () => ({
  // in incoming iterations, the owner address will be determined programmatically
  // from bitcoin manager, once there's a determined way to get the "most adequate" custodial
  // See https://github.com/BVM-priv/ui-monorepo/issues/393
  getOwner: () =>
    Promise.resolve('0xfee2f1eD73051c0f910de83d221151d9D36Ae3de' as Address),
})

export const useHemiClient = function (chainId: Chain['id'] = hemi.id) {
  const hemiClient = usePublicClient({ chainId })
  return useMemo(
    () =>
      hemiClient
        .extend(hemiPublicBitcoinKitActions())
        .extend(hemiPublicBitcoinVaultActions())
        .extend(hemiPublicBitcoinTunnelManagerActions())
        .extend(localExtensions),
    [hemiClient],
  )
}

// I wish there was a better way to infer this type, so it wouldn't depend on the hook
export type HemiPublicClient = ReturnType<typeof useHemiClient>
