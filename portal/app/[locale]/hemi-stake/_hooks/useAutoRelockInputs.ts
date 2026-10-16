import { alwaysTransferable } from '../_utils/rewardClass'

import { useEpochSystemState } from './useEpochSystemState'
import { usePositionClass } from './usePositionClass'
import { useRewardsForecastInputs } from './useRewardsForecastInputs'

export const useAutoRelockInputs = function ({
  tokenId,
  transferable,
}: {
  tokenId: bigint
  transferable: boolean | undefined
}) {
  const {
    data: inputsByClass,
    isError: isForecastError,
    refetch: refetchForecast,
  } = useRewardsForecastInputs()
  const { isError: isSystemStateError, refetch: refetchSystemState } =
    useEpochSystemState()
  const {
    data: readPositionClass,
    isError: isPositionClassError,
    refetch: refetchPositionClass,
  } = usePositionClass({ tokenId, transferable })

  const failed = [
    { isError: isPositionClassError, refetch: refetchPositionClass },
    { isError: isSystemStateError, refetch: refetchSystemState },
    { isError: isForecastError, refetch: refetchForecast },
  ].find(query => query.isError)

  return {
    hasError: failed !== undefined,
    inputsByClass,
    positionClass:
      transferable === true ? alwaysTransferable : readPositionClass,
    retry: failed?.refetch ?? refetchForecast,
  }
}
