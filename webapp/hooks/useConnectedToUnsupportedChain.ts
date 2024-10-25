import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useAccount as useEvmAccount } from 'wagmi'

export const useConnectedToUnsupportedEvmChain = function () {
  // if connected to unsupported network, "chain" is undefined
  const { chain, status } = useEvmAccount()
  return ['connected', 'reconnecting'].includes(status) && chain === undefined
}

export const useConnectedToUnsupportedBtcChain = function () {
  const { chain, status } = useBtcAccount()
  return ['connected', 'reconnecting'].includes(status) && chain === undefined
}
