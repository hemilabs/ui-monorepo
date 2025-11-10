import { useQuery } from '@tanstack/react-query'
import { getPricePerShare } from 'hemi-btc-staking-actions/actions'
import { useHemiClient } from 'hooks/useHemiClient'

export const usePoolTokenValue = function () {
  const hemiClient = useHemiClient()
  return useQuery({
    queryFn: () => getPricePerShare({ client: hemiClient }),
    queryKey: ['btc-staking', 'pool-token-value', hemiClient.chain?.id],
  })
}
