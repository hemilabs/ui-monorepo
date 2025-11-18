import { parseEther } from 'viem'

import { epochsPerYear, secondsPerEpoch } from './lockCreationTimes'

/**
 * Calculates reward weight decay over 60 epochs (360 days)
 * Reward weight (from balanceOfNFT) decreases linearly from current to 0 at unlock
 *
 * Note: This is different from voting power used in governance.
 * Reward weight = balanceOfNFT (used for reward distribution)
 * Voting power = voteDelegation.getVotes (used for governance, includes delegations)
 *
 * @param currentTimestamp - Current timestamp (unix timestamp in seconds)
 * @param currentBalance - Current balance of the position from balanceOfNFT (in wei)
 * @param lockEndTimestamp - When the lock ends (unix timestamp in seconds)
 * @returns Array of 60 reward weight values (in wei) for each epoch
 *
 * @example
 * // Position with 100 veHEMI unlocking in 180 days (30 epochs)
 * calculateRewardWeightDecay({
 *   currentBalance: 100000000000000000000n, // 100 veHEMI from balanceOfNFT
 *   lockEndTimestamp: 1747324800n, // 180 days from now
 *   currentTimestamp: 1731772800n,
 * })
 * // Returns: [100, 96.67, 93.33, ..., 3.33, 0, 0, ..., 0] (60 values)
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
 * @param rewardsPerVeHEMI - Array of 60 rewards per veHEMI from API (decimals in ether)
 * @param rewardWeightDecay - Array of 60 reward weight values for each epoch (in wei)
 * @returns APR as percentage (e.g., 4.84 for 4.84%)
 *
 * @example
 * calculateApr({
 *   lockedAmount: 9674533770000000000n,              // 9.67 HEMI
 *   rewardsPerVeHEMI: [0.001568, 0.001310, ...],    // 60 values from API
 *   rewardWeightDecay: [100n, 96n, 93n, ...],        // 60 values from calculateRewardWeightDecay
 * })
 * // Returns: 4.84 (meaning 4.84% APR)
 */
export function calculateApr({
  lockedAmount,
  rewardsPerVeHEMI,
  rewardWeightDecay,
}: {
  lockedAmount: bigint
  rewardsPerVeHEMI: number[]
  rewardWeightDecay: bigint[]
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
    // Convert decimal to wei using parseEther for precision
    // rewardsPerVeHEMI comes as a decimal number (e.g., 0.001568 HEMI per veHEMI)
    const rewardsPerVeHEMIWei = parseEther(rewardsPerVeHEMI[i].toString())

    // rewards[i] = (rewardWeight[i] × rewardsPerVeHEMI[i]) / 1e18
    // rewardWeightDecay is in wei (e.g., 100000000000000000000n)
    // Both are now in wei, so divide by 1e18 to get result in wei
    const rewardsAtEpoch =
      (rewardWeightDecay[i] * rewardsPerVeHEMIWei) / BigInt(1e18)

    totalRewards += rewardsAtEpoch
  }

  // APR = (totalRewards / lockedAmount) × 100
  // Multiply by 10000 for precision (2 decimal places)
  const aprBigInt = (totalRewards * BigInt(10000)) / lockedAmount

  return Number(aprBigInt) / 100
}
