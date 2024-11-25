import {
  hemiPublicBitcoinKitActions,
  hemiPublicBitcoinTunnelManagerActions,
  hemiPublicSimpleBitcoinVaultActions,
  hemiPublicSimpleBitcoinVaultStateActions,
  hemiWalletBitcoinTunnelManagerActions,
} from 'hemi-viem'
import { useMemo } from 'react'
import { hemiPublicExtraActions } from 'utils/hemiClientExtraActions'
import { type WalletClient, type PublicClient } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'

import { useHemi } from './useHemi'

export const publicClientToHemiClient = (publicClient: PublicClient) =>
  publicClient
    .extend(hemiPublicBitcoinKitActions())
    .extend(hemiPublicSimpleBitcoinVaultActions())
    .extend(hemiPublicSimpleBitcoinVaultStateActions())
    .extend(hemiPublicBitcoinTunnelManagerActions())
    .extend(hemiPublicExtraActions())

export const useHemiClient = function () {
  const hemi = useHemi()
  const hemiClient = usePublicClient({ chainId: hemi.id })
  return useMemo(() => publicClientToHemiClient(hemiClient), [hemiClient])
}

const walletClientToHemiClient = (walletClient: WalletClient) =>
  walletClient.extend(hemiWalletBitcoinTunnelManagerActions())

export const useHemiWalletClient = function () {
  const hemi = useHemi()
  const { data: hemiWalletClient, ...rest } = useWalletClient({
    chainId: hemi.id,
    query: { select: walletClientToHemiClient },
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
