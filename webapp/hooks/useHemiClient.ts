import {
  hemiPublicBitcoinKitActions,
  hemiPublicBitcoinTunnelManagerActions,
  hemiPublicSimpleBitcoinVaultActions,
  hemiPublicSimpleBitcoinVaultStateActions,
  hemiWalletBitcoinTunnelManagerActions,
} from 'hemi-viem'
import { useMemo } from 'react'
import { type PublicClient } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'

import { useHemi } from './useHemi'

const localExtensions = () => ({
  // in incoming iterations, the vault index will be determined programmatically
  // once there's a determined way to get the "most adequate" custodial and support multiple types
  // of vaults - See https://github.com/hemilabs/ui-monorepo/issues/393
  getVaultChildIndex: () => Promise.resolve(1), // Talk to max if we can remove this hardcoded
})

export const publicClientToHemiClient = (publicClient: PublicClient) =>
  publicClient
    .extend(hemiPublicBitcoinKitActions())
    .extend(hemiPublicSimpleBitcoinVaultActions())
    .extend(hemiPublicSimpleBitcoinVaultStateActions())
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
