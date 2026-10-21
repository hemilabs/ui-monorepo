import { useHemiToken } from 'hooks/useHemiToken'
import { useMemo } from 'react'
import { type StakingPosition } from 'types/stakingDashboard'
import { unixNowTimestamp } from 'utils/time'
import { parseTokenUnits } from 'utils/token'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'

import { useRewardsForecastInputs } from '../../_hooks/useRewardsForecastInputs'
import { useStakingPositions } from '../../_hooks/useStakingPositions'
import { getBlendedForecast } from '../../_utils/blendedForecast'
import { wholeDaysToSeconds } from '../../_utils/lockCreationTimes'
import { getEpochEnd, getLockEnd } from '../../_utils/lockEpochs'
import {
  alwaysTransferable,
  emptyInputsByClass,
  type PositionClass,
} from '../../_utils/rewardClass'
import { isActiveStake } from '../../_utils/walletStakedTotal'
import { useEstimator } from '../_context/estimatorContext'
import { canForecast } from '../_utils/canForecast'

import { useNeedsWallet } from './useNeedsWallet'
import { usePositionClasses } from './usePositionClasses'

const toLockEnd = (position: StakingPosition) =>
  getLockEnd({
    lockTime: Number(position.lockTime),
    timestamp: Number(position.timestamp),
  })

const toStakedPositions = function ({
  now,
  positions,
  wallet,
}: {
  now: number
  positions: StakingPosition[] | undefined
  wallet: Address | undefined
}) {
  if (!positions || !wallet) {
    return []
  }

  const settledAt = getEpochEnd({ epochsAhead: 0, now })

  return positions.filter(
    position =>
      isActiveStake(position, wallet) && toLockEnd(position) > settledAt,
  )
}

const toExistingLegs = (
  positions: StakingPosition[],
  classes: Record<string, PositionClass>,
) =>
  positions.map(position => ({
    amount: position.amount,
    lockEnd: toLockEnd(position),
    positionClass: classes[position.tokenId.toString()] ?? alwaysTransferable,
  }))

const toLoadState = (
  queries: { data: unknown; isError: boolean; isLoading: boolean }[],
) => ({
  isError: queries.some(query => query.isError && query.data === undefined),
  isLoading: queries.some(query => query.isLoading),
})

export const useEstimatorForecast = function () {
  const { amount, lockupDays, scope } = useEstimator()
  const { address } = useAccount()
  const token = useHemiToken()
  const needsWallet = useNeedsWallet()

  // Frozen on mount so the projection does not shift while the amount is typed.
  const now = useMemo(() => Number(unixNowTimestamp()), [])

  const blends = scope === 'with-my-positions' && !needsWallet

  const forecastInputs = useRewardsForecastInputs()
  const positions = useStakingPositions()

  const staked = useMemo(
    () =>
      blends
        ? toStakedPositions({ now, positions: positions.data, wallet: address })
        : [],
    [address, blends, now, positions.data],
  )

  const classes = usePositionClasses(blends ? staked : undefined)

  const amountUnits = parseTokenUnits(amount, token)
  const inputsByClass = forecastInputs.data ?? emptyInputsByClass
  const lockDurationInSeconds = Number(wholeDaysToSeconds(lockupDays))

  const { blended, stakedAlone } = useMemo(
    function () {
      const existing = classes.data ? toExistingLegs(staked, classes.data) : []
      const run = (incomingAmount: bigint) =>
        getBlendedForecast({
          existing,
          incoming: { amount: incomingAmount, lockDurationInSeconds },
          inputsByClass,
          now,
        })

      return { blended: run(amountUnits), stakedAlone: run(BigInt(0)).existing }
    },
    [
      amountUnits,
      classes.data,
      inputsByClass,
      lockDurationInSeconds,
      now,
      staked,
    ],
  )

  return {
    forecast: blended,
    hasForecast: canForecast({
      amountUnits,
      inputsByClass,
      lockupDays,
      staked,
    }),
    isBlended: staked.length > 0,
    ...toLoadState(
      blends ? [forecastInputs, positions, classes] : [forecastInputs],
    ),
    needsWallet,
    stakedReturnRatio: stakedAlone.yearOneReturnRatio,
  }
}
