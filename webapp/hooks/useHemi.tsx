import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { useMemo } from 'react'
import { type EvmChain } from 'types/chain'

import { useNetworkType } from './useNetworkType'

export const useHemi = function () {
  const [type] = useNetworkType()
  return useMemo(
    (): EvmChain => (type === 'testnet' ? hemiTestnet : hemiMainnet),
    [type],
  )
}
