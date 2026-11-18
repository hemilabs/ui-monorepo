import { useMemo } from 'react'

import { getEpochEnd, getLockEnd } from '../_utils/lockEpochs'
import { getRewardClassAt } from '../_utils/rewardClass'

import { useEpochAnchoredNow } from './useEpochAnchoredNow'
import { useEpochSystemState } from './useEpochSystemState'
import { usePositionClasses } from './usePositionClasses'
import { useRewardsForecastInputs } from './useRewardsForecastInputs'
import { useStakingPositions } from './useStakingPositions'

export const usePositionForecastInputs = function (
  tokenId: bigint | undefined,
) {
  const systemState = useEpochSystemState()
  const now = useEpochAnchoredNow(systemState.data?.currentEpoch)
  const forecastInputs = useRewardsForecastInputs()
  const positions = useStakingPositions()

  const position = useMemo(
    () => positions.data?.find(candidate => candidate.tokenId === tokenId),
    [positions.data, tokenId],
  )

  const classes = usePositionClasses(position ? [position] : undefined)

  const positionClass = position && classes.data?.[position.tokenId.toString()]

  const lockEnd =
    position &&
    getLockEnd({
      lockTime: Number(position.lockTime),
      timestamp: Number(position.timestamp),
    })

  const queries = [systemState, forecastInputs, positions]
  const watched = position === undefined ? queries : [...queries, classes]
  const failed = watched.filter(
    query => query.isError && query.data === undefined,
  )

  const carriedFrom =
    positionClass === undefined || forecastInputs.data === undefined
      ? undefined
      : forecastInputs.data[
          getRewardClassAt({
            at: getEpochEnd({ epochsAhead: 0, now }),
            ...positionClass,
          })
        ].carriedFrom

  return {
    carriedFrom,
    currentEpoch: systemState.data?.currentEpoch,
    inputsByClass: forecastInputs.data,
    isError: failed.length > 0,
    isMissingPosition: positions.data !== undefined && position === undefined,
    isPending: watched.some(query => query.isPending),
    lockEnd,
    now,
    position,
    positionClass,
    retry: () => failed.forEach(query => query.refetch()),
  }
}
