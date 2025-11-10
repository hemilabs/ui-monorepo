/**
 * Calculates the daily rewards for a position based on its voting power ratio
 * @param rewardsPerDay - The total rewards distributed per day for a specific token
 * @param totalSupply - The total veHEMI supply at the same timestamp
 * @param votingPower - The voting power of the position at a specific timestamp
 * @returns Daily rewards for the position in the same token denomination
 */
export function calculateDailyRewards({
  rewardsPerDay,
  totalSupply,
  votingPower,
}: {
  rewardsPerDay: bigint
  totalSupply: bigint
  votingPower: bigint
}) {
  if (totalSupply === BigInt(0) || votingPower === BigInt(0)) {
    return BigInt(0)
  }

  return (votingPower * rewardsPerDay) / totalSupply
}

/**
 * Calculates the Annual Percentage Yield (APY) based on daily rewards and locked amount
 * Formula: APY = (totalDailyRewards * 365.25 * 100) / lockedAmount
 * @param lockedAmount - Amount of tokens locked in the position
 * @param totalDailyRewards - Sum of daily rewards from all reward tokens
 * @returns APY as a percentage number (e.g., 4.84 for 4.84%)
 */
export function calculateApy({
  lockedAmount,
  totalDailyRewards,
}: {
  lockedAmount: bigint
  totalDailyRewards: bigint
}) {
  if (totalDailyRewards === BigInt(0) || lockedAmount === BigInt(0)) {
    return 0
  }

  // 365.25 days * 100, used for APY calculations with scaling
  const daysPerYearTimes100 = BigInt(36525)

  // Multiply by 10000 to maintain precision before division
  const apyBigInt =
    (totalDailyRewards * daysPerYearTimes100 * BigInt(10000)) /
    (lockedAmount * BigInt(100))

  return Number(apyBigInt) / 100
}
