import { getTunnelContracts } from 'utils/crossChainMessenger'
import { Chain } from 'viem'

import { useHemi } from './useHemi'

export const useL2BridgeAddress = function (l1ChainId: Chain['id']) {
  const hemi = useHemi()
  return getTunnelContracts(hemi, l1ChainId).L2Bridge
}
