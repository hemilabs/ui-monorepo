export const rewardClasses = ['forfeitable', 'locked', 'transferable'] as const

export type RewardClass = (typeof rewardClasses)[number]

type RewardClassInputs = {
  baseline?: bigint
  weight: bigint
}

export type InputsByClass = Record<RewardClass, RewardClassInputs>

export const emptyInputsByClass: InputsByClass = {
  forfeitable: { weight: BigInt(0) },
  locked: { weight: BigInt(0) },
  transferable: { weight: BigInt(0) },
}

export type PositionClass = {
  forfeitable: boolean
  transferableAfter: number
}

export const alwaysTransferable: PositionClass = {
  forfeitable: false,
  transferableAfter: 0,
}

const getOwnClass = (forfeitable: boolean) =>
  forfeitable ? 'forfeitable' : 'locked'

export const getRewardClassAt = ({
  at,
  forfeitable,
  transferableAfter,
}: {
  at: number
  forfeitable: boolean
  transferableAfter: number
}) => (at >= transferableAfter ? 'transferable' : getOwnClass(forfeitable))
