import { useToken } from 'hooks/useToken'
import { getVeHemiContractAddress } from 've-hemi-actions'

import { useHemi } from './useHemi'

export const useVeHemiToken = function () {
  const chainId = useHemi().id
  const veHemiAddress = getVeHemiContractAddress(chainId)

  return useToken({
    address: veHemiAddress,
    chainId,
  })
}
