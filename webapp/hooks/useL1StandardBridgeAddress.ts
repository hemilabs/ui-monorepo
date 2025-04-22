import { getTunnelContracts } from 'utils/chain'
import { Chain } from 'viem'

import { useHemi } from './useHemi'

export const useL1StandardBridgeAddress = function (l1ChainId: Chain['id']) {
  const hemi = useHemi()
  return getTunnelContracts(hemi, l1ChainId).L1StandardBridge
}
