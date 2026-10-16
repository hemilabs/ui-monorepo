import { useEpochSystemState } from './useEpochSystemState'
import { usePositionClass } from './usePositionClass'
import { useRewardsForecastInputs } from './useRewardsForecastInputs'

export const useAutoRelockInputs = function (tokenId: bigint) {
  const {
    data: inputsByClass,
    isError: isForecastError,
    refetch: refetchForecast,
  } = useRewardsForecastInputs()
  const { isError: isSystemStateError, refetch: refetchSystemState } =
    useEpochSystemState()
  const {
    data: positionClass,
    isError: isPositionClassError,
    refetch: refetchPositionClass,
  } = usePositionClass(tokenId)

  const failed = [
    { isError: isPositionClassError, refetch: refetchPositionClass },
    { isError: isSystemStateError, refetch: refetchSystemState },
    { isError: isForecastError, refetch: refetchForecast },
  ].find(query => query.isError)

  return {
    hasError: failed !== undefined,
    inputsByClass,
    positionClass,
    retry: failed?.refetch ?? refetchForecast,
  }
}
