import { minLockAmount } from 've-hemi-actions'

export const showsMinimumStakeWarning = (amountUnits: bigint) =>
  amountUnits > BigInt(0) && amountUnits < minLockAmount
