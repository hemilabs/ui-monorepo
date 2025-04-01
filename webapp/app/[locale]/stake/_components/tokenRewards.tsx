import { Fragment, ReactNode } from 'react'
import { Reward, StakeToken } from 'types/stake'

import {
  BabypiePoints,
  BedrockPoints,
  BitFiPoints,
  BsquaredPoints,
  LorenzoPoints,
  HemiPoints,
  Hemi2xPoints,
  PumpBtcPoints,
  SolvPoints,
  UnirouterPoints,
  EigenpiePoints,
  KernelPoints,
  YieldNestPoints,
} from './pointsTag'

type Props = {
  rewards: StakeToken['extensions']['rewards']
}

const rewardComponentMap: Record<Reward, ReactNode> = {
  babypie: <BabypiePoints />,
  bedrock: <BedrockPoints />,
  bitfi: <BitFiPoints />,
  bsquared: <BsquaredPoints />,
  eigenpie: <EigenpiePoints />,
  hemi: <HemiPoints />,
  hemi2x: <Hemi2xPoints />,
  kernel: <KernelPoints />,
  lorenzo: <LorenzoPoints />,
  pumpbtc: <PumpBtcPoints />,
  solv: <SolvPoints />,
  unirouter: <UnirouterPoints />,
  yieldnest: <YieldNestPoints />,
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
