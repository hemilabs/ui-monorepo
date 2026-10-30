import { minLockAmount } from 've-hemi-actions'

export const isBelowMinimumStake = (amountUnits: bigint) =>
  amountUnits > BigInt(0) && amountUnits < minLockAmount
