import { hemi, hemiSepolia } from 'hemi-viem'
import { type Address } from 'viem'

const VE_HEMI_REWARDS_CONTRACT_ADDRESSES: Record<number, Address> = {
  [hemi.id]: '0x0d85B6676d499c05FE06fcB6A3b620334Eb8012F',
  [hemiSepolia.id]: '0xa6c5DE7512521Cb8d4c6bBA45dF9bbb280aB276d',
} as const

// Deliberately empty: `VeHemiEpochRewards` is not deployed on any chain the Portal
// serves, and on a devnet the address comes from a scenario kit and differs per
// deployment. Everything reading this resolver no-ops while it is empty, so the
// capture-before-withdraw guard can ship now and starts working when an address lands.
const VE_HEMI_EPOCH_REWARDS_CONTRACT_ADDRESSES: Record<
  number,
  Address | undefined
> = {}

export const getVeHemiRewardsContractAddress = function (chainId: number) {
  const address = VE_HEMI_REWARDS_CONTRACT_ADDRESSES[chainId]
  if (!address) {
    throw new Error(`veHEMI Rewards contract not deployed on chain ${chainId}`)
  }
  return address
}

// The epoch rewards address for a chain, or `undefined` where it is not deployed.
// Unlike the resolver above this does not throw - no address means the chain is still on
// the continuous-accrual contract, which is a supported state.
export const getVeHemiEpochRewardsContractAddress = (chainId: number) =>
  VE_HEMI_EPOCH_REWARDS_CONTRACT_ADDRESSES[chainId]
