import { type QueryClient, useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { useHemiToken } from 'hooks/useHemiToken'
import { type Address, type Chain } from 'viem'

import { fetchRewardsForecastInputs } from '../_fetchers/fetchRewardsForecastInputs'

import { getClassDenominatorsQueryKeyPrefix } from './classDenominators'
import { useEpochSystemState } from './useEpochSystemState'

const getRewardsForecastInputsQueryKeyPrefix = ({
  chainId,
}: {
  chainId: Chain['id']
}) => ['rewardsForecastInputs', chainId]

const getRewardsForecastInputsQueryKey = ({
  chainId,
  currentEpoch,
  token,
}: {
  chainId: Chain['id']
  currentEpoch: number | undefined
  token: Address
}) => [
  ...getRewardsForecastInputsQueryKeyPrefix({ chainId }),
  currentEpoch,
  token,
]

export const invalidateRewardsForecastInputs = function (
  queryClient: QueryClient,
  chainId: Chain['id'],
) {
  queryClient.invalidateQueries({
    queryKey: getClassDenominatorsQueryKeyPrefix({ chainId }),
  })
  queryClient.invalidateQueries({
    queryKey: getRewardsForecastInputsQueryKeyPrefix({ chainId }),
  })
}

export const useRewardsForecastInputs = function () {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const token = useHemiToken().address as Address
  const { data: systemState } = useEpochSystemState()

  return useQuery({
    enabled: !!systemState,
    queryFn: ({ client }) =>
      fetchRewardsForecastInputs(client, {
        chainId,
        currentEpoch: systemState!.currentEpoch,
        firstFundableEpoch: systemState!.firstFundableEpoch,
        hemiClient,
        token,
      }),
    queryKey: getRewardsForecastInputsQueryKey({
      chainId,
      currentEpoch: systemState?.currentEpoch,
      token,
    }),
    staleTime: 5 * 60 * 1000,
  })
}
