import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { useHemiToken } from 'hooks/useHemiToken'
import { toChecksumAddress } from 'utils/address'
import { type Address, type Chain } from 'viem'

import { fetchRewardsForecastInputs } from '../_fetchers/fetchRewardsForecastInputs'

import { useEpochSystemState } from './useEpochSystemState'

const getRewardsForecastInputsQueryKey = ({
  chainId,
  currentEpoch,
  token,
}: {
  chainId: Chain['id']
  currentEpoch: number | undefined
  token: Address
}) => ['rewardsForecastInputs', chainId, currentEpoch, token]

export const useRewardsForecastInputs = function () {
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const token = toChecksumAddress(useHemiToken().address)
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
