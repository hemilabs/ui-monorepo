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

import { useRewardTokensAddresses } from './useRewardTokensAddresses'

const secondsPerDay = BigInt(86400)
// 365.25 days * 100, used for APY calculations with scaling
const daysPerYearTimes100 = BigInt(36525)

const getCalculateApyQueryKey = ({
  chainId,
  tokenId,
}: {
  chainId: number
  tokenId: bigint
}) => ['calculateApy', tokenId.toString(), chainId]

function calculateCurrentDayTimestamp(startingTimestamp: bigint) {
  const now = BigInt(Math.floor(Date.now() / 1000))
  const daysSinceStart = (now - startingTimestamp) / secondsPerDay
  return startingTimestamp + daysSinceStart * secondsPerDay
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
      const [startingTimestamp, lockedBalance] = await Promise.all([
        getStartingTimestamp(hemiWalletClient!),
        getLockedBalance(hemiWalletClient!, tokenId),
      ])

      if (lockedBalance.amount === BigInt(0)) {
        return 0
      }

      const currentDayTimestamp =
        calculateCurrentDayTimestamp(startingTimestamp)

      let totalDailyRewardsBigInt = BigInt(0)

      // Sum daily rewards from all reward tokens
      for (const rewardToken of rewardTokenAddresses) {
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

        if (totalSupply === BigInt(0) || votingPower === BigInt(0)) {
          continue
        }

        // dailyRewards = (votingPower * rewardsPerDay) / totalSupply
        totalDailyRewardsBigInt += (votingPower * rewardsPerDay) / totalSupply
      }

      if (totalDailyRewardsBigInt === BigInt(0)) {
        return 0
      }

      // apy = (totalDailyRewards * 365.25 * 10000) / (lockedAmount * 100) / 100
      // Multiply by 10000 to maintain precision before division
      const apyBigInt =
        (totalDailyRewardsBigInt * daysPerYearTimes100 * BigInt(10000)) /
        (lockedBalance.amount * BigInt(100))

      return Number(apyBigInt) / 100 // return as percentage
    },
    queryKey,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  })
}
