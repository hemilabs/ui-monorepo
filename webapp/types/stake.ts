import { Address } from 'viem'

import { type EvmToken, type Extensions } from './token'

export const stakeProtocols = [
  'bedRock',
  'bitFi',
  'exSat',
  'hemi',
  'lorenzo',
  'merlinChain',
  'nodeDao',
  'pumpBtc',
  'solv',
  'stakeStone',
  'uniRouter',
] as const

export type StakeProtocols = (typeof stakeProtocols)[number]

export type Reward =
  | 'bedrock'
  | 'bitfi'
  | 'bsquared'
  | 'hemi'
  | 'lorenzo'
  | 'pumpbtc'
  | 'solv'
  | 'unirouter'

export type StakeToken = Omit<EvmToken, 'address'> & {
  // we can override Address because we only stake erc20 (native tokens excluded), so we know for sure
  // that address is of Address type
  address: Address
  // EvmToken has a broad definition of "protocol", but for StakeToken let's make a
  // defined list of protocols that make a token a Stake one.
  extensions: Omit<Extensions, 'protocol'> & {
    protocol: StakeProtocols
    rewards: Reward[]
  }
}
