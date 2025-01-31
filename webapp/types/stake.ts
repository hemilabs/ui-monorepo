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

export type Reward = 'hemi' | 'points'

export type StakeToken = EvmToken & {
  // EvmToken has a broad definition of "protocol", but for StakeToken let's make a
  // defined list of protocols that make a token a Stake one.
  extensions: Omit<Extensions, 'protocol'> & {
    protocol: StakeProtocols
    rewards: Reward[]
  }
}
