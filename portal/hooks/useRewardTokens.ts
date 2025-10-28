import { hemi, hemiSepolia } from 'hemi-viem'
import { useHemi } from 'hooks/useHemi'
import type { Address, Chain } from 'viem'

type RewardTokenConfig = {
  address: Address
  symbol: string
}

// Define the reward tokens and their addresses
// There is a method to dynamically fetch them from the veHEMI contract
// So this is just temporary
const rewardTokensMap: Record<Chain['id'], RewardTokenConfig[]> = {
  [hemi.id]: [
    {
      address: '0x...' as Address, // TODO: Add mainnet HEMI address
      symbol: 'HEMI',
    },
    {
      address: '0x...' as Address, // TODO: Add mainnet hemiBTC address
      symbol: 'hemiBTC',
    },
  ],
  [hemiSepolia.id]: [
    {
      address: '0x2315ab2800c25D0f932dD7f5D15CeA43cAA614Dd',
      symbol: 'HEMI',
    },
    {
      address: '0x7270A269B6236038de02dBE39Ca1e7DA8d562Dcd',
      symbol: 'hemiBTC',
    },
  ],
}

export const useRewardTokens = function () {
  const hemiChain = useHemi()
  return rewardTokensMap[hemiChain.id] || []
}
