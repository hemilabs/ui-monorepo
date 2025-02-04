import { useQuery } from '@tanstack/react-query'
import { useHemiClient } from 'hooks/useHemiClient'
import { useNetworkType } from 'hooks/useNetworkType'
import { StakeToken } from 'types/stake'
import { useAccount } from 'wagmi'

export const useStakedBalance = function (token: StakeToken) {
  const { address, isConnected } = useAccount()
  const [networkType] = useNetworkType()
  const hemiClient = useHemiClient()

  function getStakedBalance() {
    if (!hemiClient || !address) return Promise.resolve(BigInt(0))
    return hemiClient.stakedBalance({ address, tokenAddress: token.address })
  }

  const { data: balance, ...rest } = useQuery({
    enabled: isConnected,
    queryFn: getStakedBalance,
    queryKey: [
      'staked-token-balance',
      address,
      networkType,
      token.chainId,
      token.address,
    ],
  })
  return {
    balance,
    ...rest,
  }
}
