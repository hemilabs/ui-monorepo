import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { useMemo } from 'react'
import { renderToString } from 'react-dom/server'
import { type EvmChain } from 'types/chain'
import { HemiSymbolWhite } from 'ui-common/components/hemiLogo'

import { useNetworkType } from './useNetworkType'

export const useHemi = function () {
  const [type] = useNetworkType()
  return useMemo(
    (): EvmChain => ({
      ...(type === 'testnet' ? hemiTestnet : hemiMainnet),
      // See https://github.com/hemilabs/ui-monorepo/issues/478 for when to remove
      iconBackground: '#FFFFFF',
      iconUrl: () =>
        Promise.resolve(
          `data:image/svg+xml;base64,${btoa(
            renderToString(<HemiSymbolWhite />),
          )}`,
        ),
    }),
    [type],
  )
}
