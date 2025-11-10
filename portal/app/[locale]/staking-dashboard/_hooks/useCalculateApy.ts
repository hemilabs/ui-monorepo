import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import {
  getBalanceOfNFTAt,
  getLockedBalance,
  getTotalVeHemiSupplyAt,
} from 've-hemi-actions/actions'
import {
  getMaxConfiguredReward,
  getRewardPeriodsForDay,
  getStartingTimestamp,
} from 've-hemi-rewards/actions'

import { calculateApy, calculateDailyRewards } from '../_utils/apyCalculations'
import { daySeconds } from '../_utils/lockCreationTimes'

import { useRewardTokensAddresses } from './useRewardTokensAddresses'

const getCalculateApyQueryKey = ({
  chainId,
  tokenId,
}: {
  chainId: number
  tokenId: bigint
}) => ['calculateApy', tokenId.toString(), chainId]

function calculateCurrentDayTimestamp(startingTimestamp: bigint) {
  const daySecondsBigInt = BigInt(daySeconds)
  const now = BigInt(Math.floor(Date.now() / 1000))
  const daysSinceStart = (now - startingTimestamp) / daySecondsBigInt
  return startingTimestamp + daysSinceStart * daySecondsBigInt
}

export const useCalculateApy = function ({
  enabled = true,
  tokenId,
}: {
  enabled?: boolean
  tokenId: bigint
}): UseQueryResult<number, Error> {
  const { hemiWalletClient } = useHemiWalletClient()
  const { id } = useHemi()
  const { data: rewardTokenAddresses = [] } = useRewardTokensAddresses()

  const queryKey = getCalculateApyQueryKey({
    chainId: id,
    tokenId,
  })

  return useQuery({
    enabled:
      enabled &&
      !!hemiWalletClient &&
      rewardTokenAddresses.length > 0 &&
      tokenId > BigInt(0),
    async queryFn() {
      // Step 1: Fetch initial data
      const [startingTimestamp, lockedBalance] = await Promise.all([
        getStartingTimestamp(hemiWalletClient!),
        getLockedBalance(hemiWalletClient!, tokenId),
      ])

      if (lockedBalance.amount === BigInt(0)) {
        return 0
      }

      const currentDayTimestamp =
        calculateCurrentDayTimestamp(startingTimestamp)

      // Step 2: Fetch all reward token data
      const rewardTokenData = await Promise.all(
        rewardTokenAddresses.map(async function (rewardToken) {
          const maxConfigured = await getMaxConfiguredReward(
            hemiWalletClient!,
            rewardToken,
          )

          // Use the most recent configured timestamp if current day is beyond maximum configured
          const timestampToUse =
            currentDayTimestamp > maxConfigured
              ? maxConfigured
              : currentDayTimestamp

          const [rewardsPerDay, totalSupply, votingPower] = await Promise.all([
            getRewardPeriodsForDay(
              hemiWalletClient!,
              rewardToken,
              timestampToUse,
            ),
            getTotalVeHemiSupplyAt(hemiWalletClient!, timestampToUse),
            getBalanceOfNFTAt(hemiWalletClient!, tokenId, timestampToUse),
          ])

          return { rewardsPerDay, totalSupply, votingPower }
        }),
      )

      // Step 3: Calculate total daily rewards
      const totalDailyRewards = rewardTokenData.reduce(function (
        acc,
        { rewardsPerDay, totalSupply, votingPower },
      ) {
        const dailyRewards = calculateDailyRewards({
          rewardsPerDay,
          totalSupply,
          votingPower,
        })
        return acc + dailyRewards
      }, BigInt(0))

      // Step 4: Calculate APY
      return calculateApy({
        lockedAmount: lockedBalance.amount,
        totalDailyRewards,
      })
    },
    queryKey,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  })
}
