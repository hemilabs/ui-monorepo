import { hemi, hemiSepolia } from 'hemi-viem'
import { type Address } from 'viem'

// TODO : Add contract addresses when available
const VE_HEMI_REWARDS_CONTRACT_ADDRESSES: Record<number, Address> = {
  [hemi.id]: '0x0d85B6676d499c05FE06fcB6A3b620334Eb8012F',
  [hemiSepolia.id]: '0xa6c5DE7512521Cb8d4c6bBA45dF9bbb280aB276d',
} as const

export const getVeHemiRewardsContractAddress = function (chainId: number) {
  const address = VE_HEMI_REWARDS_CONTRACT_ADDRESSES[chainId]
  if (!address) {
    throw new Error(`veHEMI Rewards contract not deployed on chain ${chainId}`)
  }
  return address
}
