import { getEligibility } from 'tge-claim'
import { useAccount } from 'wagmi'

export const useEligibleForTokens = function () {
  const { address } = useAccount()
  return getEligibility(address)
}
