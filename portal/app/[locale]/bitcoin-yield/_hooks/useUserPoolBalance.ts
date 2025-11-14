import { useQuery } from '@tanstack/react-query'
import { getUserBalance } from 'hemi-btc-staking-actions/actions'
import { useHemiClient } from 'hooks/useHemiClient'
import { type Chain } from 'viem'
import { useAccount } from 'wagmi'

const getUserPoolBalanceQueryKey = (chainId: Chain['id'] | undefined) => [
  'btc-staking',
  'user-pool-balance',
  chainId,
]

export const useUserPoolBalance = function () {
  const { address } = useAccount()
  const hemiClient = useHemiClient()
  return useQuery({
    enabled: address !== undefined,
    queryFn: () => getUserBalance({ account: address!, client: hemiClient }),
    queryKey: getUserPoolBalanceQueryKey(hemiClient.chain?.id),
  })
}
