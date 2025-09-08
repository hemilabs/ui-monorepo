import Big from 'big.js'
import { LockupMonths } from 'genesis-drop-actions'
import { NetworkType } from 'hooks/useNetworkType'
import { smartRound } from 'smart-round'
import { formatUnits } from 'viem'

const formatter = smartRound(12, 2, 2)

export const formatHemi = (amount: bigint, decimals: number) =>
  formatter(formatUnits(amount, decimals), {
    roundingMode: 'round-down',
    shouldFormat: true,
  })

export const isClaimRewardsEnabledOnTestnet = (networkType: NetworkType) =>
  networkType !== 'testnet' ||
  process.env.NEXT_PUBLIC_ENABLE_CLAIM_REWARDS_TESTNET === 'true'

/**
 * Calculates the staked and unlocked amounts based on the total amount and lockup ratio
 */
const calculateLockupAmounts = function (
  totalAmount: bigint,
  lockupRatio: number,
) {
  const stakedHemi = Big(totalAmount.toString())
    .times(Big(lockupRatio))
    .div(Big(100))
    .toFixed()
  const unlockedHemi = Big(totalAmount.toString())
    .minus(stakedHemi.toString())
    .toFixed()

  return {
    staked: BigInt(stakedHemi),
    unlocked: BigInt(unlockedHemi),
  }
}

/**
 * Applies a bonus percentage to an amount
 */
const applyBonus = function (amount: bigint, bonusPercentage: number) {
  // apply the bonus. Similar to lockup, bonus may include decimals.
  const bonus = Big(amount.toString())
    .times(Big(bonusPercentage))
    .div(Big(100))
    .toFixed()

  return amount + BigInt(bonus)
}

/**
 * Calculates the final staked and unlocked amounts including bonus
 */
export const calculateSplitAmount = function ({
  amount,
  bonusPercentage,
  lockupRatio,
}: {
  amount: bigint
  bonusPercentage: number
  lockupRatio: number
}) {
  const { staked, unlocked } = calculateLockupAmounts(amount, lockupRatio)

  return {
    staked: applyBonus(staked, bonusPercentage),
    unlocked: applyBonus(unlocked, bonusPercentage),
  }
}

export const getMultiplier = function (lockupMonths: LockupMonths) {
  const multipliers: Partial<Record<LockupMonths, number>> = {
    24: 3.25,
    48: 6.25,
  }

  return multipliers[lockupMonths]!
}
