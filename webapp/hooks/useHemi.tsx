import { type Chain as RainbowKitChain } from '@rainbow-me/rainbowkit'
import { hemi as hemiMainnet, hemiSepolia as hemiTestnet } from 'hemi-viem'
import { useMemo } from 'react'
import { renderToString } from 'react-dom/server'
import { HemiSymbolWhite } from 'ui-common/components/hemiLogo'
import { type Chain } from 'viem'

import { useNetworkType } from './useNetworkType'

type EvmChain = Omit<Chain, 'fees' | 'serializers'> &
  Pick<RainbowKitChain, 'iconBackground' | 'iconUrl'>

export const useHemi = function () {
  const [type] = useNetworkType()
  return useMemo(
    () =>
      ({
        ...(type === 'testnet' ? hemiTestnet : hemiMainnet),
        // See https://github.com/hemilabs/ui-monorepo/issues/478 for when to remove
        iconBackground: '#FFFFFF',
        iconUrl: () =>
          Promise.resolve(
            `data:image/svg+xml;base64,${btoa(
              renderToString(<HemiSymbolWhite />),
            )}`,
          ),
      }) satisfies EvmChain,
    [type],
  )
}
