import { type EvmToken } from 'types/token'
import { isAddress, isAddressEqual, type Address } from 'viem'

export const findRewardToken = (tokens: EvmToken[], address: Address) =>
  tokens.find(
    candidate =>
      isAddress(candidate.address) &&
      isAddressEqual(candidate.address, address),
  )
