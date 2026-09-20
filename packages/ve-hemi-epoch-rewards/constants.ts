import { type Address } from 'viem'
import { hemi, hemiSepolia } from 'viem/chains'

const VE_HEMI_EPOCH_REWARDS_CONTRACT_ADDRESSES: Record<number, Address> = {
  [hemi.id]: '0xC7818357DF04B8FDed091b40AE8D4a0F19295Aa8',
  [hemiSepolia.id]: '0x3858B1F737cc1cA34c97Db5a7cEe1F2B1bE012C8',
} as const

const VE_HEMI_EPOCH_REWARDS_LENS_CONTRACT_ADDRESSES: Record<number, Address> = {
  [hemi.id]: '0xcf8bce2c4e666df2e527a31ba53c1dde0ec58ad6',
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
