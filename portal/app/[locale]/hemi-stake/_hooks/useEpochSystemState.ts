import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { getSystemState } from 've-hemi-epoch-rewards/actions'

import { getMaxClaimPairsQueryOptions } from './maxClaimPairs'

const getEpochSystemStateQueryKey = (chainId: number) => [
  'epochSystemState',
  chainId,
]

export const useEpochSystemState = function () {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()

  return useQuery({
    async queryFn({ client }) {
      const [systemState, maxClaimPairs] = await Promise.all([
        getSystemState(hemiClient),
        client.ensureQueryData(
          getMaxClaimPairsQueryOptions({ chainId, hemiClient }),
        ),
      ])

      return { ...systemState, maxClaimPairs }
    },
    queryKey: getEpochSystemStateQueryKey(chainId),
    // The epoch counters only move every six days, but the pause gates every claim
    // button and can flip at any moment.
    refetchInterval: 60 * 1000,
  })
}
