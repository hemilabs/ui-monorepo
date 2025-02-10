import { Fragment, ReactNode } from 'react'
import { Reward, StakeToken } from 'types/stake'

import {
  BedrockPoints,
  BitFiPoints,
  BsquaredPoints,
  LorenzoPoints,
  HemiPoints,
  PumpBtcPoints,
  SolvPoints,
  UnirouterPoints,
} from './pointsTag'

type Props = {
  rewards: StakeToken['extensions']['rewards']
}

const rewardComponentMap: Record<Reward, ReactNode> = {
  bedrock: <BedrockPoints />,
  bitfi: <BitFiPoints />,
  bsquared: <BsquaredPoints />,
  hemi: <HemiPoints />,
  lorenzo: <LorenzoPoints />,
  pumpbtc: <PumpBtcPoints />,
  solv: <SolvPoints />,
  unirouter: <UnirouterPoints />,
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
