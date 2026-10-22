import { type StakingPosition } from 'types/stakingDashboard'
import { minLockAmount } from 've-hemi-actions'

import { isValidLockup } from '../../_utils/lockupError'
import {
  type InputsByClass,
  type RewardClass,
  rewardClasses,
} from '../../_utils/rewardClass'

const isFunded = (inputsByClass: InputsByClass, rewardClass: RewardClass) =>
  (inputsByClass[rewardClass].baseline ?? BigInt(0)) > BigInt(0)

export const canForecast = function ({
  amountUnits,
  inputsByClass,
  lockupDays,
  staked,
}: {
  amountUnits: bigint
  inputsByClass: InputsByClass
  lockupDays: number
  staked: StakingPosition[]
}) {
  const blends = staked.length > 0
  const hasFunding = blends
    ? rewardClasses.some(rewardClass => isFunded(inputsByClass, rewardClass))
    : isFunded(inputsByClass, 'transferable')
  const meetsMinimum =
    amountUnits >= minLockAmount || (blends && amountUnits === BigInt(0))

  return hasFunding && meetsMinimum && isValidLockup({ value: lockupDays })
}
