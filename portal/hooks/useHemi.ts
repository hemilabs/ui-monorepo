import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { useMemo } from 'react'
import { type Chain } from 'viem'

import { useNetworkType } from './useNetworkType'

export const useHemi = function () {
  const [type] = useNetworkType()
  return useMemo(
    (): Chain => (type === 'testnet' ? hemiTestnet : hemiMainnet),
    [type],
  )
}
