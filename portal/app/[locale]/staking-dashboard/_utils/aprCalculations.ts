import { EvmToken } from 'types/token'
import { parseTokenUnits } from 'utils/token'

import { epochsPerYear, secondsPerEpoch } from './lockCreationTimes'

/**
 * Calculates reward weight decay over 61 epochs (366 days)
 *
 * Note: Weight percentage is calculated as (timeRemaining / maxLockTime),
 * where maxLockTime = 4 years (1440 days). So a position with 6 months
 * remaining will have ~12.5% weight, matching the last 6 months of a 4-year position.
 *
 * The decay here projects how this weight will change over the next 61 epochs
 * based on linear time decay against the position's unlock date.
 *
 * Reward weight = balanceOfNFT (used for reward distribution)
 * Voting power = voteDelegation.getVotes (used for governance, includes delegations)
 *
 * @param currentTimestamp - Current timestamp (unix timestamp in seconds)
 * @param currentBalance - Current balance of the position from balanceOfNFT (in wei)
 * @param lockEndTimestamp - When the lock ends (unix timestamp in seconds)
 * @returns Array of 61 reward weight values (in HEMI * 10 ** 18) for each epoch
 *
 * @example
 * // Position with 25 veHEMI unlocking in 180 days (30 epochs)
 * // Note: 25 veHEMI = ~12.5% weight (180 days / 1440 days max lock time)
 * calculateRewardWeightDecay({
 *   currentBalance: 25000000000000000000n, // 25 veHEMI from balanceOfNFT
 *   lockEndTimestamp: 1747324800n, // 180 days from now
 *   currentTimestamp: 1731772800n,
 * })
 * // Returns: [25, 24.17, 23.33, ..., 0.83, 0, 0, ..., 0] (61 values)
 * // The last 31 values (epochs 30-60) are 0 since position unlocks at epoch 30
 */
export function calculateRewardWeightDecay({
  currentBalance,
  currentTimestamp,
  lockEndTimestamp,
}: {
  currentTimestamp: bigint
  currentBalance: bigint
  lockEndTimestamp: bigint
}) {
  const epochRewardWeights: bigint[] = []

  // Calculate how many epochs until unlock
  const timeUntilUnlock = lockEndTimestamp - currentTimestamp
  const epochsUntilUnlock = Math.ceil(Number(timeUntilUnlock) / secondsPerEpoch)

  for (let epoch = 0; epoch < epochsPerYear; epoch++) {
    if (epoch >= epochsUntilUnlock || epochsUntilUnlock <= 0) {
      // Lock already expired or will expire before this epoch
      epochRewardWeights.push(BigInt(0))
    } else {
      // Linear decay: weight(epoch) = currentBalance × (epochsRemaining / totalEpochs)
      const epochsRemaining = epochsUntilUnlock - epoch

      // rewardWeight = currentBalance × epochsRemaining / epochsUntilUnlock
      const weightAtEpoch =
        (currentBalance * BigInt(epochsRemaining)) / BigInt(epochsUntilUnlock)

      epochRewardWeights.push(weightAtEpoch)
    }
  }

  return epochRewardWeights
}

/**
 * Calculates APR based on rewards per veHEMI and reward weight decay
 * Uses dot product: totalRewards = Σ(rewardWeight[i] × rewardsPerVeHEMI[i])
 *
 * @param lockedAmount - Amount of HEMI locked in the position (in wei)
 * @param rewardsPerVeHEMI - Array of 61 rewards per veHEMI from API (decimals in ether)
 * @param rewardWeightDecay - Array of 61 reward weight values for each epoch (in wei)
 * @param token - The HEMI token object for unit parsing
 * @returns APR as percentage (e.g., 4.84 for 4.84%)
 *
 * @example
 * calculateApr({
 *   lockedAmount: 9674533770000000000n,              // 9.67 HEMI
 *   rewardsPerVeHEMI: [0.001568, 0.001310, ...],    // 61 values from API
 *   rewardWeightDecay: [100n, 96n, 93n, ...],        // 61 values from calculateRewardWeightDecay
 * })
 * // Returns: 4.84 (meaning 4.84% APR)
 */
export function calculateApr({
  lockedAmount,
  rewardsPerVeHEMI,
  rewardWeightDecay,
  token,
}: {
  lockedAmount: bigint
  rewardsPerVeHEMI: number[]
  rewardWeightDecay: bigint[]
  token: EvmToken
}) {
  if (lockedAmount === BigInt(0)) {
    return 0
  }

  if (rewardsPerVeHEMI.length !== epochsPerYear) {
    throw new Error(
      `Expected ${epochsPerYear} rewards values, got ${rewardsPerVeHEMI.length}`,
    )
  }

  if (rewardWeightDecay.length !== epochsPerYear) {
    throw new Error(
      `Expected ${epochsPerYear} reward weight values, got ${rewardWeightDecay.length}`,
    )
  }

  // Dot product: totalRewards = Σ(rewardWeight[i] × rewardsPerVeHEMI[i])
  let totalRewards = BigInt(0)

  for (let i = 0; i < epochsPerYear; i++) {
    // Convert decimal to wei using parseTokenUnits for explicit HEMI token handling
    // rewardsPerVeHEMI comes as a decimal number (e.g., 0.001568 HEMI per veHEMI)
    const rewardsPerVeHEMIWei = parseTokenUnits(
      rewardsPerVeHEMI[i].toString(),
      token,
    )

    // rewards[i] = (rewardWeight[i] × rewardsPerVeHEMI[i]) / 10^decimals
    // rewardWeightDecay is in wei (e.g., 100000000000000000000n)
    // Both are now in smallest token units, so divide by 10^decimals to get result
    const rewardsAtEpoch =
      (rewardWeightDecay[i] * rewardsPerVeHEMIWei) /
      BigInt(10 ** token.decimals)

    totalRewards += rewardsAtEpoch
  }

  // APR = (totalRewards / lockedAmount) × 100
  // Multiply by 10000 for precision (2 decimal places)
  const aprBigInt = (totalRewards * BigInt(10000)) / lockedAmount

  return Number(aprBigInt) / 100
}
