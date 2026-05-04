import { hemi, hemiSepolia } from 'hemi-viem'
import { type Address, zeroAddress } from 'viem'

const EARN_VAULT_ADDRESSES: Record<number, Address[]> = {
  [hemi.id]: [
    zeroAddress, // TODO: replace with deployed hemiBTC vault address once provided, or via on-chain registry
    zeroAddress, // TODO: replace with deployed USDC vault address once provided, or via on-chain registry
  ],
  [hemiSepolia.id]: [
    zeroAddress, // TODO: replace with deployed hemiBTC vault address once provided, or via on-chain registry
    zeroAddress, // TODO: replace with deployed USDC vault address once provided, or via on-chain registry
  ],
} as const

export const getEarnVaultAddresses = function (chainId: number): Address[] {
  const addresses = EARN_VAULT_ADDRESSES[chainId]
  if (!addresses || addresses.length === 0) {
    throw new Error(`Earn vaults not deployed on chain ${chainId}`)
  }
  return [...addresses]
}

export const getEarnChainIds = () =>
  Object.keys(EARN_VAULT_ADDRESSES).map(Number)
