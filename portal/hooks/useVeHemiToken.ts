import { useToken } from 'hooks/useToken'
import { EvmToken } from 'types/token'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { type Address } from 'viem'

import { useHemi } from './useHemi'
import { useHemiToken } from './useHemiToken'

export const useVeHemiToken = function (): EvmToken {
  const hemiToken = useHemiToken()
  const chainId = useHemi().id
  const veHemiAddress = getVeHemiContractAddress(chainId)

  const { data: token } = useToken({
    address: veHemiAddress as Address,
    chainId,
    options: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 60 * 24,
    },
  })

  return (token ?? {
    ...hemiToken,
    symbol: `ve${hemiToken.symbol}`,
  }) as EvmToken
}
