import { Fragment, ReactNode } from 'react'
import { Reward, StakeToken } from 'types/stake'

import { HemiTag, PointsTag } from './rewardTag'

interface Props {
  rewards: StakeToken['extensions']['rewards']
}

// TODO: It's pending to implement some missing tags
// Issue #799 https://github.com/hemilabs/ui-monorepo/issues/799
const rewardComponentMap: Record<Reward, ReactNode> = {
  hemi: <HemiTag />,
  points: <PointsTag />,
}

export function TokenRewards({ rewards }: Props) {
  if (!rewards || rewards.length === 0) {
    return null
  }
  return (
    <>
      {rewards.map(reward => (
        <Fragment key={reward}>{rewardComponentMap[reward]}</Fragment>
      ))}
    </>
  )
}
