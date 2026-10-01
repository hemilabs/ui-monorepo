import { type StakingPosition } from 'types/stakingDashboard'

export const prependPosition =
  (newPosition: StakingPosition) => (old: StakingPosition[] | undefined) =>
    old?.some(({ tokenId }) => tokenId === newPosition.tokenId)
      ? old
      : old && [newPosition, ...old]

export const updatePosition =
  ({
    tokenId,
    update,
  }: {
    tokenId: StakingPosition['tokenId']
    update: (position: StakingPosition) => StakingPosition
  }) =>
  (old: StakingPosition[] | undefined) =>
    old?.map(position =>
      position.tokenId === tokenId ? update(position) : position,
    )
