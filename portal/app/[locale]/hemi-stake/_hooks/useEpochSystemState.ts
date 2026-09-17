import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { getMaxClaimPairs, getSystemState } from 've-hemi-epoch-rewards/actions'

const getEpochSystemStateQueryKey = (chainId: number) => [
  'epochSystemState',
  chainId,
]

export const useEpochSystemState = function () {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()

  return useQuery({
    async queryFn() {
      const [systemState, maxClaimPairs] = await Promise.all([
        getSystemState(hemiClient),
        getMaxClaimPairs(hemiClient),
      ])

      return { ...systemState, maxClaimPairs }
    },
    queryKey: getEpochSystemStateQueryKey(chainId),
    // The epoch counters only move every six days, but the pause gates every claim
    // button and can flip at any moment.
    refetchInterval: 60 * 1000,
  })
}
