import { hemi, hemiSepolia } from 'hemi-viem'
import type { Address } from 'viem'

const VE_HEMI_CONTRACT_ADDRESSES: Record<number, Address> = {
  // TODO: Add hemi mainnet address when available
  [hemiSepolia.id]: '0x54e24e64653F97477872D320c4d116D03a201493',
} as const

export const SUPPORTED_CHAINS: number[] = [hemi.id, hemiSepolia.id]

// Maximum lock duration is 4 years (in seconds)
export const MAX_LOCK_DURATION = BigInt(4 * 365 * 24 * 60 * 60) // 4 years in seconds

// Minimum lock duration (1 week in seconds)
export const MIN_LOCK_DURATION = BigInt(7 * 24 * 60 * 60) // 1 week in seconds

export const getVeHemiContractAddress = function (chainId: number) {
  const address = VE_HEMI_CONTRACT_ADDRESSES[chainId]
  if (!address) {
    throw new Error(`veHEMI contract not deployed on chain ${chainId}`)
  }
  return address
}
