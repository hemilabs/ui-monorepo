import { useEpochSystemState } from './useEpochSystemState'

/**
 * Whether claiming is stopped right now.
 */
export const useRewardsPaused = function () {
  const { data: systemState } = useEpochSystemState()

  return systemState?.paused === true
}
