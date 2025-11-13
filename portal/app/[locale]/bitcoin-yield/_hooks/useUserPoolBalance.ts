import { useQuery } from '@tanstack/react-query'
import { getUserBalance } from 'hemi-btc-staking-actions/actions'
import { useHemiClient } from 'hooks/useHemiClient'
import { useAccount } from 'wagmi'

export const useUserPoolBalance = function () {
  const { address } = useAccount()
  const hemiClient = useHemiClient()
  return useQuery({
    enabled: address !== undefined,
    queryFn: () => getUserBalance({ account: address!, client: hemiClient }),
    queryKey: ['btc-staking', 'user-pool-balance', hemiClient.chain?.id],
  })
}
