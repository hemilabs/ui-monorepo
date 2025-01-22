import { StaticImageData } from 'next/image'

import { EvmToken } from './token'

export type StakeProtocols =
  | 'bedRock'
  | 'bitFi'
  | 'exSat'
  | 'hemi'
  | 'lorenzo'
  | 'merlinChain'
  | 'pumpBtc'
  | 'solv'
  | 'stakeStone'
  | 'uniRouter'

export type StakeToken = EvmToken & {
  logo: StaticImageData
  protocol: StakeProtocols
}
