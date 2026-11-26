import { hemiWalletBitcoinTunnelManagerActions } from 'hemi-viem'
import { type WalletClient } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'

import { useHemi } from './useHemi'

export const useHemiClient = function () {
  const hemi = useHemi()
  return usePublicClient({ chainId: hemi.id })!
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

// I wish there was a better way to infer this types, so it wouldn't depend on the hook
export type HemiWalletClient = ReturnType<
  typeof useHemiWalletClient
>['hemiWalletClient']
