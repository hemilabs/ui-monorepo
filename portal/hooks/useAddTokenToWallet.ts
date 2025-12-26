import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { EvmToken } from 'types/token'
import { type Address } from 'viem'
import { useAccount, useWalletClient } from 'wagmi'
import watchAsset from 'wallet-watch-asset'

import { useEnsureConnectedTo } from './useEnsureConnectedTo'
import { useUmami } from './useUmami'

type Options = {
  mutation?: Omit<UseMutationOptions, 'mutationFn'>
  token: EvmToken
}

export const useAddTokenToWallet = function (options: Options) {
  const { address } = useAccount()
  const ensureConnectedTo = useEnsureConnectedTo()
  const { data: walletClient } = useWalletClient({
    chainId: options.token.chainId,
  })
  const { track } = useUmami()

  return useMutation({
    async mutationFn() {
      const { token } = options

      await ensureConnectedTo(options.token.chainId)

      return watchAsset(
        // @ts-expect-error walletClient is a different type, but it matches the Provider interface
        walletClient,
        address,
        {
          address: token.address as Address,
          chainId: token.chainId,
          // token logos include the small Hemi logo, but wallets crop it.
          // Besides, many wallets add the chain logo anyways, so we're safe to
          // use the L1 logo version
          logoURI: token.extensions?.l1LogoURI,
        },
        localStorage,
      )
    },
    onError: () =>
      track?.('save token wallet - error', { address: options.token.address }),
    onSuccess: () =>
      track?.('save token wallet - ok', { address: options.token.address }),
    ...(options?.mutation ?? {}),
  })
}
