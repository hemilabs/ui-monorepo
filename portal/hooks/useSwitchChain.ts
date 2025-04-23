import { useConfig as useBtcConfig } from 'btc-wallet/hooks/useConfig'
import { useSwitchChain as useSwitchBtcChain } from 'btc-wallet/hooks/useSwitchChain'
import { useMemo } from 'react'
import { RemoteChain } from 'types/chain'
import {
  useChains as useEvmChains,
  useSwitchChain as useSwitchEvmChain,
} from 'wagmi'

export const useSwitchChain = function () {
  const { chains: btcChains } = useBtcConfig()
  const evmChains = useEvmChains()
  const { switchChain: switchBtcChain } = useSwitchBtcChain()
  const { switchChain: switchEvmChain } = useSwitchEvmChain()

  return useMemo(
    () => ({
      switchChain({ chainId }: { chainId: RemoteChain['id'] }) {
        const isEvm = typeof chainId === 'number'
        const walletTargetNetwork = isEvm
          ? evmChains.find(chain => chain.id === chainId)
          : btcChains.find(chain => chain.id === chainId)

        if (!walletTargetNetwork) {
          throw new Error(`Invalid chainId ${chainId}`)
        }

        if (isEvm) {
          switchEvmChain({ chainId })
        } else {
          switchBtcChain({ chainId })
        }
      },
    }),
    [btcChains, evmChains, switchBtcChain, switchEvmChain],
  )
}
