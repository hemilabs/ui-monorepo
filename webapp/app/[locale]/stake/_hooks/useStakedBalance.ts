import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { StakeToken } from 'types/stake'
import { useAccount } from 'wagmi'

export const useStakedBalance = function (token: StakeToken) {
  const { address, isConnected } = useAccount()
  const [networkType] = useNetworkType()

  const { data: balance, ...rest } = useQuery({
    enabled: isConnected,
    // TODO call hemiClient.stakedBalance(tokenAddress, address) once defined
    // See https://github.com/hemilabs/ui-monorepo/issues/774
    queryFn: () => Promise.resolve(BigInt(0)),
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
