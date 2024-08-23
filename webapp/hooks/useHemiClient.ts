import {
  hemiPublicBitcoinKitActions,
  hemiPublicBitcoinTunnelManagerActions,
  hemiPublicBitcoinVaultActions,
  hemiWalletBitcoinTunnelManagerActions,
} from 'hemi-viem'
import { useMemo } from 'react'
import { type Address, type PublicClient } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'

import { useHemi } from './useHemi'

const localExtensions = () => ({
  // in incoming iterations, the owner address will be determined programmatically
  // from bitcoin manager, once there's a determined way to get the "most adequate" custodial
  // See https://github.com/hemilabs/ui-monorepo/issues/393
  getOwner: () =>
    Promise.resolve('0xfee2f1eD73051c0f910de83d221151d9D36Ae3de' as Address),
})

export const publicClientToHemiClient = (publicClient: PublicClient) =>
  publicClient
    .extend(hemiPublicBitcoinKitActions())
    .extend(hemiPublicBitcoinVaultActions())
    .extend(hemiPublicBitcoinTunnelManagerActions())
    .extend(localExtensions)

export const useHemiClient = function () {
  const hemi = useHemi()
  const hemiClient = usePublicClient({ chainId: hemi.id })
  return useMemo(() => publicClientToHemiClient(hemiClient), [hemiClient])
}

export const useHemiWalletClient = function () {
  const hemi = useHemi()
  const { data: hemiWalletClient, ...rest } = useWalletClient({
    chainId: hemi.id,
    query: {
      select: walletClient =>
        walletClient.extend(hemiWalletBitcoinTunnelManagerActions()),
    },
  })

  return {
    hemiWalletClient,
    ...rest,
  }
}

// I wish there was a better way to infer these types, so it wouldn't depend on the hook
export type HemiPublicClient = ReturnType<typeof useHemiClient>
export type HemiWalletClient = ReturnType<
  typeof useHemiWalletClient
>['hemiWalletClient']
