import { zeroAddress, type Address } from 'viem'
import { hemi, hemiSepolia } from 'viem/chains'

// TODO mainned is placeholder
const VE_HEMI_EPOCH_REWARDS_CONTRACT_ADDRESSES: Record<number, Address> = {
  [hemi.id]: zeroAddress,
  [hemiSepolia.id]: '0x3858B1F737cc1cA34c97Db5a7cEe1F2B1bE012C8',
} as const

const VE_HEMI_EPOCH_REWARDS_LENS_CONTRACT_ADDRESSES: Record<number, Address> = {
  [hemi.id]: zeroAddress,
  [hemiSepolia.id]: '0x5C77b15F0E60D437B1137Ce646D0419Be1315442',
} as const

export const getVeHemiEpochRewardsContractAddress = function (chainId: number) {
  const address = VE_HEMI_EPOCH_REWARDS_CONTRACT_ADDRESSES[chainId]
  if (!address) {
    throw new Error(
      `veHEMI Epoch Rewards contract not deployed on chain ${chainId}`,
    )
  }
  return address
}

export const getVeHemiEpochRewardsLensContractAddress = function (
  chainId: number,
) {
  const address = VE_HEMI_EPOCH_REWARDS_LENS_CONTRACT_ADDRESSES[chainId]
  if (!address) {
    throw new Error(
      `veHEMI Epoch Rewards Lens contract not deployed on chain ${chainId}`,
    )
  }
  return address
}
