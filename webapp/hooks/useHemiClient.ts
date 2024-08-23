import { hemi } from 'app/networks'
import {
  hemiPublicBitcoinKitActions,
  hemiPublicBitcoinTunnelManagerActions,
  hemiPublicBitcoinVaultActions,
  hemiWalletBitcoinTunnelManagerActions,
} from 'hemi-viem'
import { useMemo } from 'react'
import { type Address, type Chain, type PublicClient } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'

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

export const useHemiClient = function (chainId: Chain['id'] = hemi.id) {
  const hemiClient = usePublicClient({ chainId })
  return useMemo(() => publicClientToHemiClient(hemiClient), [hemiClient])
}

export const useHemiWalletClient = function (chainId: Chain['id'] = hemi.id) {
  const { data: hemiWalletClient, ...rest } = useWalletClient({
    chainId,
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
