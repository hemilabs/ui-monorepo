import { hemi, hemiSepolia } from 'hemi-viem'
import type { Address } from 'viem'

const VE_HEMI_CONTRACT_ADDRESSES: Record<number, Address> = {
  [hemi.id]: '0x371d3718D5b7F75EAb050FAe6Da7DF3092031c89',
  [hemiSepolia.id]: '0x54e24e64653F97477872D320c4d116D03a201493',
} as const

export const SupportedChains: number[] = [hemi.id, hemiSepolia.id]

// See https://docs.soliditylang.org/en/latest/units-and-global-variables.html#time-units
// Maximum lock duration is 4 years (a year is defined in the contract as 365.25 days)
export const MaxLockDurationSeconds = 4 * 365.25 * 24 * 60 * 60

// Minimum lock duration (12 days in seconds)
export const MinLockDurationSeconds = 12 * 24 * 60 * 60

export const getVeHemiContractAddress = function (chainId: number) {
  const address = VE_HEMI_CONTRACT_ADDRESSES[chainId]
  if (!address) {
    throw new Error(`veHEMI contract not deployed on chain ${chainId}`)
  }
  return address
}
