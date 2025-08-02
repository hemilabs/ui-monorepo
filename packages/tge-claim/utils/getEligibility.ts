import { Address } from 'viem'

import { type EligibilityData } from '../types/claim'

import airdropData from './airdrop.json'

// Check if an address is eligible for claiming
export const getEligibility = function (address: Address | undefined) {
  if (!address) {
    return undefined
  }
  return (airdropData as EligibilityData[]).find(
    entry => entry.address.toLowerCase() === address.toLowerCase(),
  )
}
