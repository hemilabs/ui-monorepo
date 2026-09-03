import { hemi, hemiSepolia } from 'hemi-viem'
import { type Address, parseUnits } from 'viem'

const VE_HEMI_CONTRACT_ADDRESSES: Record<number, Address> = {
  [hemi.id]: '0x371d3718D5b7F75EAb050FAe6Da7DF3092031c89',
  [hemiSepolia.id]: '0x54e24e64653F97477872D320c4d116D03a201493',
} as const

export const SupportedChains: number[] = [hemi.id, hemiSepolia.id]

// In the contract: YEAR = 365.25 days, SIX_DAYS = YEAR / (12 * 5) = 525,960 seconds
export const SixDaysSeconds = 525_960

// See https://docs.soliditylang.org/en/latest/units-and-global-variables.html#time-units
// Maximum lock duration is 4 years (a year is defined in the contract as 365.25 days)
export const MaxLockDurationSeconds = 4 * 365.25 * 24 * 60 * 60

// MinLockDuration = 2 * SIX_DAYS = 1,051,920 seconds
export const MinLockDurationSeconds = SixDaysSeconds * 2

// MIN_LOCK_AMOUNT in the contract is a private constant set to 10 HEMI.
// See https://github.com/hemilabs/veHEMI/blob/c6a65c74154377e8720f584b364bdc109fbdedc5/src/VeHemi.sol#L964
export const minLockAmount = parseUnits('10', 18)

export const getVeHemiContractAddress = function (chainId: number) {
  const address = VE_HEMI_CONTRACT_ADDRESSES[chainId]
  if (!address) {
    throw new Error(`veHEMI contract not deployed on chain ${chainId}`)
  }
  return address
}
