import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { EvmToken } from 'types/token'
import { type Address } from 'viem'
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi'
import watchAsset from 'wallet-watch-asset'

import { useUmami } from './useUmami'

type Options = {
  mutation?: Omit<UseMutationOptions, 'mutationFn'>
  token: EvmToken
}

export const useAddTokenToWallet = function (options: Options) {
  const { address, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { data: walletClient } = useWalletClient()
  const { track } = useUmami()

  return useMutation({
    async mutationFn() {
      const { token } = options
      // users must be connected to hemi to add tokens.
      if (chainId !== token.chainId) {
        await switchChainAsync({ chainId: token.chainId })
      }
      return watchAsset(
        walletClient,
        address,
        {
          address: token.address as Address,
          chainId: token.chainId,
          // token logos include the small Hemi logo, but wallets crop it.
          // Besides, many wallets add the chain logo anyways, so we're safe to
          // use the L1 logo version
          logoURI: token.extensions.l1LogoURI,
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
